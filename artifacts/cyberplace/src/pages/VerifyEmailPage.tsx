import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Verification failed");
        }
        setStatus("success");
        setMessage("Your email has been verified. You can sign in now.");
      })
      .catch((error: Error) => {
        setStatus("error");
        setMessage(error.message || "Verification failed");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background pt-14">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <div className="mb-4 flex justify-center">
          {status === "loading" && <LoaderCircle className="w-8 h-8 text-primary animate-spin" />}
          {status === "success" && <CheckCircle2 className="w-8 h-8 text-primary" />}
          {status === "error" && <ShieldAlert className="w-8 h-8 text-destructive" />}
        </div>
        <h1 className="text-xl font-bold mb-2">Email verification</h1>
        <p className="text-sm text-muted-foreground mb-5">{message}</p>
        <Button onClick={() => setLocation("/login")}>
          Go to login
        </Button>
      </div>
    </div>
  );
}
