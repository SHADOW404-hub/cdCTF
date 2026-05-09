import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { ctfTasksTable, ctfAttemptsTable, usersTable, userTitlesTable, titlesTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { authenticateToken, optionalAuth } from "../middleware/auth";
import { hashFlag, isHashedFlag, verifyFlag } from "../lib/flags";

const router = Router();

// GET /api/ctf
router.get("/", optionalAuth, async (req, res) => {
  const { category, difficulty, search, solved } = req.query as Record<string, string>;
  const userId = req.user?.userId;

  let challenges = await db.select().from(ctfTasksTable);

  if (category && category !== "All") challenges = challenges.filter(c => c.category === category);
  if (difficulty && difficulty !== "All") challenges = challenges.filter(c => c.difficulty === difficulty);
  if (search) challenges = challenges.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  let result;
  if (userId) {
    const attempts = await db.select().from(ctfAttemptsTable).where(eq(ctfAttemptsTable.userId, userId));
    const attemptMap = new Map(attempts.map(a => [a.ctfId, a]));
    result = challenges.map(ch => {
      const attempt = attemptMap.get(ch.id);
      return {
        id: ch.id, name: ch.name, nameUz: ch.nameUz, nameRu: ch.nameRu,
        category: ch.category, difficulty: ch.difficulty, points: ch.points,
        solvedCount: 0, isSolved: attempt?.solved ?? false, isBlocked: attempt?.blocked ?? false,
        wrongAttempts: attempt?.wrongAttempts ?? 0, hintUsed: attempt?.hintUsed ?? false,
        fileUrl: ch.fileUrl,
      };
    }).filter(ch => {
      if (solved === "true") return ch.isSolved;
      if (solved === "false") return !ch.isSolved;
      return true;
    });
  } else {
    result = challenges.map(ch => ({
      id: ch.id, name: ch.name, nameUz: ch.nameUz, nameRu: ch.nameRu,
      category: ch.category, difficulty: ch.difficulty, points: ch.points,
      solvedCount: 0, isSolved: false, isBlocked: false, wrongAttempts: 0, hintUsed: false, fileUrl: ch.fileUrl,
    }));
  }

  // Compute solvedCount for each
  const allAttempts = await db.select().from(ctfAttemptsTable).where(eq(ctfAttemptsTable.solved, true));
  const solveMap = new Map<number, number>();
  for (const a of allAttempts) {
    solveMap.set(a.ctfId, (solveMap.get(a.ctfId) ?? 0) + 1);
  }
  result = result.map(ch => ({ ...ch, solvedCount: solveMap.get(ch.id) ?? 0 }));

  res.json(result);
});

// GET /api/ctf/stats
router.get("/stats", async (_req, res) => {
  const challenges = await db.select().from(ctfTasksTable);
  const allAttempts = await db.select().from(ctfAttemptsTable).where(eq(ctfAttemptsTable.solved, true));
  const solveMap = new Map<number, number>();
  for (const a of allAttempts) {
    solveMap.set(a.ctfId, (solveMap.get(a.ctfId) ?? 0) + 1);
  }

  const categoryCounts = Object.entries(
    challenges.reduce((acc, ch) => { acc[ch.category] = (acc[ch.category] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([category, count]) => ({ category, count }));

  const mostSolved = [...challenges]
    .map(ch => ({ id: ch.id, name: ch.name, solvedCount: solveMap.get(ch.id) ?? 0 }))
    .sort((a, b) => b.solvedCount - a.solvedCount)
    .slice(0, 5);

  res.json({ totalChallenges: challenges.length, categoryCounts, mostSolved });
});

// GET /api/ctf/:id
router.get("/:id", optionalAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [challenge] = await db.select().from(ctfTasksTable).where(eq(ctfTasksTable.id, id)).limit(1);
  if (!challenge) return res.status(404).json({ error: "Not found" });

  const allAttempts = await db.select().from(ctfAttemptsTable).where(eq(ctfAttemptsTable.ctfId, id));
  const solvedCount = allAttempts.filter(a => a.solved).length;

  let userAttempt = null;
  if (req.user) {
    userAttempt = allAttempts.find(a => a.userId === req.user!.userId) ?? null;
  }

  res.json({
    id: challenge.id, name: challenge.name, nameUz: challenge.nameUz, nameRu: challenge.nameRu,
    description: challenge.description, descriptionUz: challenge.descriptionUz, descriptionRu: challenge.descriptionRu,
    category: challenge.category, difficulty: challenge.difficulty, points: challenge.points,
    hintCost: challenge.hintCost, fileUrl: challenge.fileUrl,
    solvedCount,
    isSolved: userAttempt?.solved ?? false,
    isBlocked: userAttempt?.blocked ?? false,
    hintUsed: userAttempt?.hintUsed ?? false,
    wrongAttempts: userAttempt?.wrongAttempts ?? 0,
    hint: userAttempt?.hintUsed ? challenge.hint : null,
  });
});

async function submitFlagHandler(req: Request, res: Response) {
  const ctfId = Number(req.params.id);
  const userId = req.user!.userId;
  const { flag } = req.body;

  if (!Number.isInteger(ctfId) || ctfId <= 0) return res.status(400).json({ error: "Invalid CTF id" });
  if (typeof flag !== "string" || flag.trim().length === 0 || flag.length > 512) {
    return res.status(400).json({ error: "Flag is required" });
  }

  const [challenge] = await db.select().from(ctfTasksTable).where(eq(ctfTasksTable.id, ctfId)).limit(1);
  if (!challenge) return res.status(404).json({ error: "Not found" });

  let [attempt] = await db.select().from(ctfAttemptsTable).where(and(eq(ctfAttemptsTable.userId, userId), eq(ctfAttemptsTable.ctfId, ctfId))).limit(1);

  if (attempt?.solved) return res.json({ correct: true, blocked: false, wrongAttempts: attempt.wrongAttempts });
  if (attempt?.blocked) return res.json({ correct: false, blocked: true, wrongAttempts: attempt.wrongAttempts });

  if (verifyFlag(flag, challenge.flag)) {
    if (!isHashedFlag(challenge.flag)) {
      await db.update(ctfTasksTable).set({ flag: hashFlag(challenge.flag) }).where(eq(ctfTasksTable.id, ctfId));
    }
    const pointsToAward = attempt?.hintUsed
      ? Math.floor(challenge.points * (1 - challenge.hintCost / 100))
      : challenge.points;

    if (!attempt) {
      await db.insert(ctfAttemptsTable).values({ userId, ctfId, solved: true, solvedAt: new Date(), wrongAttempts: 0, updatedAt: new Date() });
    } else {
      await db.update(ctfAttemptsTable).set({ solved: true, solvedAt: new Date(), updatedAt: new Date() }).where(eq(ctfAttemptsTable.id, attempt.id));
    }

    await db.update(usersTable).set({ points: sql`${usersTable.points} + ${pointsToAward}` }).where(eq(usersTable.id, userId));

    // Check for title award
    await checkAndAwardTitle(userId, challenge.category);

    return res.json({ correct: true, blocked: false, wrongAttempts: 0, pointsEarned: pointsToAward });
  } else {
    const newWrongAttempts = (attempt?.wrongAttempts ?? 0) + 1;
    const blocked = newWrongAttempts >= 3;

    if (!attempt) {
      await db.insert(ctfAttemptsTable).values({ userId, ctfId, wrongAttempts: newWrongAttempts, blocked, blockedAt: blocked ? new Date() : undefined, updatedAt: new Date() });
    } else {
      await db.update(ctfAttemptsTable).set({ wrongAttempts: newWrongAttempts, blocked, blockedAt: blocked ? new Date() : null, updatedAt: new Date() }).where(eq(ctfAttemptsTable.id, attempt.id));
    }

    return res.json({ correct: false, blocked, wrongAttempts: newWrongAttempts });
  }
}

// POST /api/ctf/:id/submit
router.post("/:id/submit", authenticateToken, submitFlagHandler);

// Backward-compatible alias.
router.post("/:id/flag", authenticateToken, submitFlagHandler);

// POST /api/ctf/:id/hint
router.post("/:id/hint", authenticateToken, async (req, res) => {
  const ctfId = Number(req.params.id);
  const userId = req.user!.userId;

  if (!Number.isInteger(ctfId) || ctfId <= 0) return res.status(400).json({ error: "Invalid CTF id" });

  const [challenge] = await db.select().from(ctfTasksTable).where(eq(ctfTasksTable.id, ctfId)).limit(1);
  if (!challenge) return res.status(404).json({ error: "Not found" });

  if (!challenge.hint) return res.status(400).json({ error: "No hint available" });

  let [attempt] = await db.select().from(ctfAttemptsTable).where(and(eq(ctfAttemptsTable.userId, userId), eq(ctfAttemptsTable.ctfId, ctfId))).limit(1);

  if (attempt?.hintUsed) return res.json({ hint: challenge.hint });
  if (attempt?.solved) return res.json({ hint: challenge.hint });

  if (!attempt) {
    await db.insert(ctfAttemptsTable).values({ userId, ctfId, hintUsed: true, updatedAt: new Date() });
  } else {
    await db.update(ctfAttemptsTable).set({ hintUsed: true, updatedAt: new Date() }).where(eq(ctfAttemptsTable.id, attempt.id));
  }

  const hintCostPoints = Math.floor(challenge.points * challenge.hintCost / 100);
  await db.update(usersTable).set({ points: sql`GREATEST(0, ${usersTable.points} - ${hintCostPoints})` }).where(eq(usersTable.id, userId));

  res.json({ hint: challenge.hint });
});

async function checkAndAwardTitle(userId: number, category: string) {
  const categoryTitleMap: Record<string, string> = {
    Crypto: "Kriptograf", Web: "Web Hacker", Reverse: "Reverse Engineer",
    Forensics: "Forensics Analyst", Pwn: "Binary Exploiter", OSINT: "OSINT Hunter",
    Steganography: "Stego Master",
  };

  const titleName = categoryTitleMap[category];
  if (!titleName) return;

  const [title] = await db.select().from(titlesTable).where(eq(titlesTable.category, category)).limit(1);
  if (!title) return;

  const [existing] = await db.select().from(userTitlesTable).where(and(eq(userTitlesTable.userId, userId), eq(userTitlesTable.titleId, title.id))).limit(1);
  if (existing) return;

  // Check if user has solved 3+ CTFs in this category
  const solvedInCategory = await db.select({ ctfId: ctfAttemptsTable.ctfId })
    .from(ctfAttemptsTable)
    .innerJoin(ctfTasksTable, and(eq(ctfAttemptsTable.ctfId, ctfTasksTable.id), eq(ctfTasksTable.category, category)))
    .where(and(eq(ctfAttemptsTable.userId, userId), eq(ctfAttemptsTable.solved, true)));

  if (solvedInCategory.length >= 3) {
    await db.insert(userTitlesTable).values({ userId, titleId: title.id });
    await db.update(usersTable).set({ points: sql`${usersTable.points} + ${title.points}` }).where(eq(usersTable.id, userId));
  }
}

export default router;
