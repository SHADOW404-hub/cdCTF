let readyPromise = null;
let serverlessPromise = null;

function loadServerless() {
  if (!serverlessPromise) {
    serverlessPromise = import("../artifacts/api-server/dist/serverless.mjs");
  }
  return serverlessPromise;
}

export default async function handler(req, res) {
  try {
    const { app, ensureDatabaseShape } = await loadServerless();
    if (!readyPromise) {
      readyPromise = ensureDatabaseShape();
    }
    await readyPromise;
    return app(req, res);
  } catch (err) {
    console.error("Vercel function initialization failed:", err);
    try {
      const { logger, reportErrorToSentry } = await loadServerless();
      logger.error({ err }, "Vercel function initialization failed");
      void reportErrorToSentry(err, { type: "vercelFunctionInitialization" });
    } catch (loggingErr) {
      console.error("Critical: Logging failed too:", loggingErr);
    }
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}
