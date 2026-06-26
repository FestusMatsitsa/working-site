import { useState, FormEvent } from "react";
import { useAuth } from "@/context/auth";
import { Shield } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) setError(result.error);
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

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-xl p-8">
          <h3 className="text-base font-semibold text-foreground mb-1">Sign in to your account</h3>
          <p className="text-sm text-muted-foreground mb-6">Use your staff email and password</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="text-sm font-medium text-foreground">Password</label>
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
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors mt-2"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            First sign-in? Enter any password — it will be set as your permanent password.
          </p>
        </div>

        <p className="text-xs text-sidebar-foreground/40 text-center mt-6">
          © {new Date().getFullYear()} Kilifi County Government ICT Unit
        </p>
      </div>
    </div>
  );
}
