import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { reportErrorToSentry } from "./lib/integrations";
import { corsOptions, createRateLimiter, securityHeaders } from "./middleware/security";

const app: Express = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(createRateLimiter({ windowMs: 15 * 60 * 1000, max: 600, keyPrefix: "global" }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

app.use("/api", router);

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled request error");
  void reportErrorToSentry(err, { route: req.originalUrl, method: req.method });
  res.status(500).json({ error: "Internal server error" });
});

export default app;
