import { useState, FormEvent } from "react";
import { useAuth } from "@/context/auth";
import { Shield, CheckCircle } from "lucide-react";

type View = "login" | "forgot" | "forgot-sent";

export default function Login() {
  const { login } = useAuth();
  const [view, setView] = useState<View>("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const result = await login(email, password);
    setLoginLoading(false);
    if (result.error) setLoginError(result.error);
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail }),
    });
    setForgotLoading(false);
    setView("forgot-sent");
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-lg mb-4">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-sidebar-primary-foreground tracking-tight">ICT Helpdesk &</h1>
          <h2 className="text-sm text-sidebar-primary-foreground/70 font-medium">Asset Management System</h2>
          <p className="text-xs text-sidebar-foreground/50 mt-1 text-center">Kilifi County Government — Dept. of Lands, Energy & Urban Development</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-xl p-8">
          {/* ── Sign-in form ── */}
          {view === "login" && (
            <>
              <h3 className="text-base font-semibold text-foreground mb-1">Sign in to your account</h3>
              <p className="text-sm text-muted-foreground mb-6">Use your staff email and password</p>

              {loginError && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email address</label>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@kilifi.go.ke"
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(email); setView("forgot"); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors mt-2"
                >
                  {loginLoading ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-6">
                First sign-in? Enter any password — it will be set as your permanent password.
              </p>
            </>
          )}

          {/* ── Forgot password form ── */}
          {view === "forgot" && (
            <>
              <h3 className="text-base font-semibold text-foreground mb-1">Reset your password</h3>
              <p className="text-sm text-muted-foreground mb-6">Enter your staff email and we'll send you a reset link.</p>

              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email address</label>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="you@kilifi.go.ke"
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {forgotLoading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <button
                onClick={() => setView("login")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors"
              >
                ← Back to sign in
              </button>
            </>
          )}

          {/* ── Confirmation ── */}
          {view === "forgot-sent" && (
            <div className="text-center space-y-4 py-2">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="text-base font-semibold text-foreground">Check your inbox</h3>
              <p className="text-sm text-muted-foreground">
                If <strong>{forgotEmail}</strong> is registered, you'll receive a reset link shortly. The link expires in 60 minutes.
              </p>
              <button
                onClick={() => setView("login")}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors mt-2"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-sidebar-foreground/40 text-center mt-6">
          © {new Date().getFullYear()} Kilifi County Government ICT Unit
        </p>
      </div>
    </div>
  );
}
