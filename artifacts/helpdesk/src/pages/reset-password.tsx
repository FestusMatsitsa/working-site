import { useState, FormEvent, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, CheckCircle, XCircle } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      setStatus("error");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    const r = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const body = await r.json().catch(() => ({}));
    if (r.ok) {
      setStatus("success");
      setMessage(body.message ?? "Password updated. You can now sign in.");
    } else {
      setStatus("error");
      setMessage(body.error ?? "Something went wrong. The link may have expired.");
    }
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-lg mb-4">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-sidebar-primary-foreground tracking-tight">ICT Helpdesk &</h1>
          <h2 className="text-sm text-sidebar-primary-foreground/70 font-medium">Asset Management System</h2>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-xl p-8">
          {status === "success" ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="text-base font-semibold text-foreground">Password updated!</h3>
              <p className="text-sm text-muted-foreground">{message}</p>
              <button
                onClick={() => setLocation("/")}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors mt-2"
              >
                Sign in now
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-base font-semibold text-foreground mb-1">Set new password</h3>
              <p className="text-sm text-muted-foreground mb-6">Choose a new password for your account.</p>

              {status === "error" && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">New password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Confirm password</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>
                {!token && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Reset token</label>
                    <input
                      type="text"
                      required
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      placeholder="Paste the token from your email"
                      className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {status === "loading" ? "Updating…" : "Set new password"}
                </button>
              </form>

              <button
                onClick={() => setLocation("/")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors"
              >
                ← Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
