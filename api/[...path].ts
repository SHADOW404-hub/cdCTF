import app from "../artifacts/api-server/src/app";
import { ensureDatabaseShape } from "../artifacts/api-server/src/lib/database";
import { reportErrorToSentry } from "../artifacts/api-server/src/lib/integrations";
import { logger } from "../artifacts/api-server/src/lib/logger";

let readyPromise: Promise<void> | null = null;

function ensureReady() {
  if (!readyPromise) {
    readyPromise = ensureDatabaseShape();
  }
  return readyPromise;
}

export default async function handler(req: unknown, res: unknown) {
  try {
    await ensureReady();
    return app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
  } catch (err) {
    logger.error({ err }, "Vercel function initialization failed");
    void reportErrorToSentry(err, { type: "vercelFunctionInitialization" });
    const response = res as { status: (code: number) => { json: (body: unknown) => void } };
    return response.status(500).json({ error: "Internal server error" });
  }
}
