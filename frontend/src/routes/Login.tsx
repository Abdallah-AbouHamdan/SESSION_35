import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import useAuth from "../store/auth";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/app");
    } catch (err: any) {
      setError(err.message || "Unable to sign in");
    }
  }

  return (
    <section className="auth-gradient">
      <div className="glass-card max-w-xl w-full p-10">
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <span className="auth-icon">
            <Mail size={26} />
          </span>
          <div>
            <h1 className="text-3xl font-semibold">Welcome back</h1>
            <p className="muted mt-1">
              Sign in to your family shopping planner
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                className="input pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                className="input pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-500">{error}</p>}

          <button type="submit" className="btn w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="muted">
            Don’t have an account?{" "}
            <Link to="/register" className="text-primary font-semibold">
              Sign up
            </Link>
          </p>
          <p className="muted-sm mt-6">
            Demo credentials: john@example.com / password
          </p>
        </div>
      </div>
    </section>
  );
}
