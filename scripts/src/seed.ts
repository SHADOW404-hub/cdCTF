import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

// Inline schema definitions to avoid workspace import issues
const titlesTable = pgTable("titles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().unique(),
  points: integer("points").notNull().default(500),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const learnCategoriesTable = pgTable("learn_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameUz: text("name_uz"),
  nameRu: text("name_ru"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleUz: text("title_uz"),
  titleRu: text("title_ru"),
  content: text("content").notNull(),
  contentUz: text("content_uz"),
  contentRu: text("content_ru"),
  categoryId: integer("category_id").notNull(),
  points: integer("points").notNull().default(50),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const lessonQuestionsTable = pgTable("lesson_questions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").notNull().$type<string[]>(),
  correctOption: integer("correct_option").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("Seeding database...");

  // Seed titles
  const existingTitles = await db.select().from(titlesTable);
  if (existingTitles.length === 0) {
    await db.insert(titlesTable).values([
      { name: "Kriptograf", category: "Crypto", points: 500 },
      { name: "Web Hacker", category: "Web", points: 500 },
      { name: "Reverse Engineer", category: "Reverse", points: 500 },
      { name: "Forensics Analyst", category: "Forensics", points: 500 },
      { name: "Binary Exploiter", category: "Pwn", points: 500 },
      { name: "OSINT Hunter", category: "OSINT", points: 500 },
      { name: "Stego Master", category: "Steganography", points: 500 },
    ]);
    console.log("✓ Titles seeded");
  }

  // Seed learn categories
  const existingCats = await db.select().from(learnCategoriesTable);
  if (existingCats.length === 0) {
    const [web, , , linux] = await db.insert(learnCategoriesTable).values([
      { name: "Web Security", nameUz: "Veb Xavfsizlik", nameRu: "Веб безопасность" },
      { name: "Cryptography", nameUz: "Kriptografiya", nameRu: "Криптография" },
      { name: "Networking", nameUz: "Tarmoqlar", nameRu: "Сети" },
      { name: "Linux & Terminal", nameUz: "Linux va Terminal", nameRu: "Linux и терминал" },
      { name: "OSINT", nameUz: "OSINT", nameRu: "OSINT" },
    ]).returning();
    console.log("✓ Categories seeded");

    // SQL Injection lesson
    const [lesson1] = await db.insert(lessonsTable).values({
      title: "Introduction to SQL Injection",
      titleUz: "SQL Injection ga Kirish",
      titleRu: "Введение в SQL Injection",
      content: `## What is SQL Injection?

SQL Injection is one of the most dangerous web vulnerabilities. It occurs when an attacker inserts malicious SQL into a query.

## Example

Vulnerable code:

\`\`\`python
query = "SELECT * FROM users WHERE username = '" + username + "'"
\`\`\`

An attacker inputs: \`' OR '1'='1\`

Result:

\`\`\`sql
SELECT * FROM users WHERE username = '' OR '1'='1'
\`\`\`

Since '1'='1' is always true, this returns all users!

## Prevention

\`\`\`python
# Use parameterized queries
cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
\`\`\`

- Never trust user input
- Use parameterized queries / ORMs
- Validate and sanitize inputs`,
      categoryId: web.id,
      points: 100,
    }).returning();

    await db.insert(lessonQuestionsTable).values([
      { lessonId: lesson1.id, question: "What is SQL Injection?", options: ["A network attack", "Inserting malicious SQL into a query", "A database optimization", "A type of encryption"], correctOption: 1, orderIndex: 0 },
      { lessonId: lesson1.id, question: "Which is the safest prevention method?", options: ["Regex filtering only", "String concatenation", "Parameterized queries", "Encoding the database"], correctOption: 2, orderIndex: 1 },
      { lessonId: lesson1.id, question: "What does ' OR '1'='1 do in SQL?", options: ["Deletes records", "Always evaluates to true", "Encrypts the query", "Creates a user"], correctOption: 1, orderIndex: 2 },
      { lessonId: lesson1.id, question: "Which SQL statement is most dangerous when injected?", options: ["SELECT", "INSERT", "DROP TABLE", "UPDATE"], correctOption: 2, orderIndex: 3 },
      { lessonId: lesson1.id, question: "What does ORM stand for?", options: ["Object Relational Mapping", "Open Resource Manager", "Optimized Runtime Module", "Object Resource Model"], correctOption: 0, orderIndex: 4 },
    ]);

    // Linux lesson
    const [lesson2] = await db.insert(lessonsTable).values({
      title: "Linux Command Line Basics",
      titleUz: "Linux Buyruqlar Qatori Asoslari",
      titleRu: "Основы командной строки Linux",
      content: `## Linux for Cybersecurity

Linux is essential for every security professional.

## Essential Commands

\`\`\`bash
pwd          # Show current directory
ls -la       # List files with permissions
cd /path     # Change directory
cat file     # Read a file
grep "text" file  # Search in file
find / -name "*.txt"  # Find files
\`\`\`

## Network Commands

\`\`\`bash
ifconfig         # Show network interfaces
netstat -tulpn   # Show listening ports
ping google.com  # Test connectivity
\`\`\`

## CTF Tools

\`\`\`bash
strings binary   # Extract strings
xxd file         # Hex dump
base64 -d file   # Decode base64
file mystery     # Identify file type
\`\`\``,
      categoryId: linux.id,
      points: 75,
    }).returning();

    await db.insert(lessonQuestionsTable).values([
      { lessonId: lesson2.id, question: "Which command shows your current directory?", options: ["ls", "cd", "pwd", "cat"], correctOption: 2, orderIndex: 0 },
      { lessonId: lesson2.id, question: "How do you make a file executable in Linux?", options: ["chmod +x file", "chown +x file", "exec file", "run file"], correctOption: 0, orderIndex: 1 },
      { lessonId: lesson2.id, question: "Which command extracts printable strings from a binary?", options: ["cat", "grep", "strings", "xxd"], correctOption: 2, orderIndex: 2 },
      { lessonId: lesson2.id, question: "What does 'netstat -tulpn' show?", options: ["Running processes", "Listening network ports", "Disk usage", "CPU usage"], correctOption: 1, orderIndex: 3 },
      { lessonId: lesson2.id, question: "What does 'base64 -d file' do?", options: ["Encodes to base64", "Decodes a base64 file", "Deletes file", "Shows file size"], correctOption: 1, orderIndex: 4 },
    ]);
    console.log("✓ Lessons seeded");
  }

  console.log("✓ Seed complete!");
  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
