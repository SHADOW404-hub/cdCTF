import app from "./app";
import { ensureDatabaseShape } from "./lib/database";
import { reportErrorToSentry } from "./lib/integrations";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
  void reportErrorToSentry(reason, { type: "unhandledRejection" });
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
  void reportErrorToSentry(err, { type: "uncaughtException" });
});

ensureDatabaseShape()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Database initialization failed");
    process.exit(1);
  });
