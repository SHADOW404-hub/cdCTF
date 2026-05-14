import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, ctfAttemptsTable, userLessonAttemptsTable, userTitlesTable, titlesTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { optionalAuth } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const currentUserId = req.user?.userId;

  const users = await db.select().from(usersTable).where(and(eq(usersTable.isBlocked, false), eq(usersTable.role, "user")));

  const allCtfSolves = await db.select().from(ctfAttemptsTable).where(eq(ctfAttemptsTable.solved, true));
  const allLessonCompletes = await db.select().from(userLessonAttemptsTable).where(eq(userLessonAttemptsTable.status, "completed"));
  const allTitles = await db.select({
    userId: userTitlesTable.userId,
    titleName: titlesTable.name,
  }).from(userTitlesTable).leftJoin(titlesTable, eq(userTitlesTable.titleId, titlesTable.id));

  const solvesMap = new Map<number, number>();
  for (const a of allCtfSolves) solvesMap.set(a.userId, (solvesMap.get(a.userId) ?? 0) + 1);

  const lessonsMap = new Map<number, number>();
  for (const a of allLessonCompletes) lessonsMap.set(a.userId, (lessonsMap.get(a.userId) ?? 0) + 1);

  const titlesMap = new Map<number, string[]>();
  for (const t of allTitles) {
    if (!titlesMap.has(t.userId)) titlesMap.set(t.userId, []);
    if (t.titleName) titlesMap.get(t.userId)!.push(t.titleName);
  }

  const entries = users
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      nickname: u.nickname,
      avatarUrl: u.avatarUrl,
      points: u.points,
      solvedCtfCount: solvesMap.get(u.id) ?? 0,
      completedLessonsCount: lessonsMap.get(u.id) ?? 0,
      titles: titlesMap.get(u.id) ?? [],
    }));

  let currentUserRank: number | undefined;
  if (currentUserId) {
    const allSorted = users.sort((a, b) => b.points - a.points);
    const idx = allSorted.findIndex(u => u.id === currentUserId);
    if (idx !== -1) currentUserRank = idx + 1;
  }

  res.json({ entries, total: users.length, currentUserRank });
});

export default router;
