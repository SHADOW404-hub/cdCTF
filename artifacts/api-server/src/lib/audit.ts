import type { Request } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db/schema";
import { logger } from "./logger";

export async function writeAuditLog(
  req: Request,
  action: string,
  targetType: string,
  targetId?: string | number,
  metadata?: Record<string, unknown>,
) {
  try {
    await db.insert(auditLogsTable).values({
      actorUserId: req.user?.userId ?? null,
      action,
      targetType,
      targetId: targetId === undefined ? null : String(targetId),
      metadata: metadata ?? null,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? null,
    });
  } catch (err) {
    logger.warn({ err, action, targetType, targetId }, "Failed to write audit log");
  }
}
