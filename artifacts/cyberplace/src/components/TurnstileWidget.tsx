import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
      }) => string;
      remove?: (widgetId: string) => void;
      reset?: (widgetId: string) => void;
    };
  }
}

type Props = {
  onTokenChange: (token: string) => void;
  onError?: () => void;
};

export function TurnstileWidget({ onTokenChange, onError }: Props) {
  const containerId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !window.turnstile) return;
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
      sitekey: siteKey,
      theme: "auto",
      callback: (token) => onTokenChange(token),
      "expired-callback": () => onTokenChange(""),
      "error-callback": () => {
        onTokenChange("");
        onError?.();
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [containerId, onTokenChange, siteKey]);

  if (!siteKey) return null;

  return <div id={containerId} className="min-h-16" />;
}
