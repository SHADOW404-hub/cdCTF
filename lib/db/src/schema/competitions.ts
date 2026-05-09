import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { ctfTasksTable } from "./ctf";

export const competitionsTable = pgTable("competitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("public"),
  inviteCode: text("invite_code"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const competitionTasksTable = pgTable("competition_tasks", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id").notNull().references(() => competitionsTable.id),
  ctfId: integer("ctf_id").notNull().references(() => ctfTasksTable.id),
});

export const competitionUsersTable = pgTable("competition_users", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id").notNull().references(() => competitionsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const competitionSolvesTable = pgTable("competition_solves", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id").notNull().references(() => competitionsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  ctfId: integer("ctf_id").notNull().references(() => ctfTasksTable.id),
  pointsEarned: integer("points_earned").notNull().default(0),
  solvedAt: timestamp("solved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCompetitionSchema = createInsertSchema(competitionsTable).omit({ id: true, createdAt: true });
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type Competition = typeof competitionsTable.$inferSelect;
export type CompetitionTask = typeof competitionTasksTable.$inferSelect;
export type CompetitionUser = typeof competitionUsersTable.$inferSelect;
