function parseSentryDsn(dsn: string) {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.split("/").filter(Boolean).pop();
    if (!projectId || !url.username) return null;
    return {
      host: `${url.protocol}//${url.host}`,
      projectId,
      publicKey: url.username,
    };
  } catch {
    return null;
  }
}

async function sendToSentry(payload: Record<string, unknown>) {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  const config = parseSentryDsn(dsn);
  if (!config) return;

  const eventId = crypto.randomUUID().replace(/-/g, "");
  const sentAt = new Date().toISOString();
  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: sentAt }),
    JSON.stringify({ type: "event", content_type: "application/json" }),
    JSON.stringify({
      event_id: eventId,
      timestamp: sentAt,
      platform: "javascript",
      level: "error",
      ...payload,
    }),
  ].join("\n");

  await fetch(`${config.host}/api/${config.projectId}/envelope/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${config.publicKey}`,
    },
    body: envelope,
  }).catch(() => undefined);
}

export function setupFrontendMonitoring() {
  window.addEventListener("error", (event) => {
    void sendToSentry({
      message: event.message || "Window error",
      exception: {
        values: [
          {
            type: event.error?.name || "Error",
            value: event.error?.message || event.message,
            stacktrace: event.error?.stack
              ? { frames: event.error.stack.split("\n").map((line: string) => ({ filename: line.trim() })) }
              : undefined,
          },
        ],
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    void sendToSentry({
      message: reason.message,
      exception: {
        values: [
          {
            type: reason.name,
            value: reason.message,
            stacktrace: reason.stack
              ? { frames: reason.stack.split("\n").map((line: string) => ({ filename: line.trim() })) }
              : undefined,
          },
        ],
      },
    });
  });
}
