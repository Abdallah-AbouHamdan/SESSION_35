import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserRound, Mail, Lock } from "lucide-react";
import useAuth from "../store/auth";
import { useTheme } from "../store/theme";

export default function Register() {
  const { register, loading } = useAuth();
  const { toggle } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    try {
      await register(formData.email, formData.password, formData.name);
      navigate("/app");
    } catch (err: any) {
      setLocalError(err?.message || "Unable to create account");
    }
  };

  return (
    <section className="auth-gradient">
      <button
        onClick={toggle}
        className="btn-secondary absolute right-6 top-6 px-3 py-2"
      >
        Toggle theme
      </button>

      <div className="glass-card w-full max-w-xl p-10">
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <span className="auth-icon">
            <UserRound size={28} />
          </span>
          <div>
            <h1 className="text-3xl font-semibold">Create your account</h1>
            <p className="muted mt-1">
              Join thousands of families shopping smarter together
            </p>
          </div>
        </div>

        {localError && (
          <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label" htmlFor="register-name">
              Full Name
            </label>
            <div className="relative">
              <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="register-name"
                className="input pl-10"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="register-email">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="register-email"
                type="email"
                className="input pl-10"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="register-password">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="register-password"
                type="password"
                className="input pl-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="register-confirm">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="register-confirm"
                type="password"
                className="input pl-10"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="muted">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
