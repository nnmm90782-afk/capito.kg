"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Coffee, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { syncUserToDB } from "../admin/actions";
import { useLang } from "../lang-provider";
import { makeT } from "../components/translations";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";

export default function RegisterPage() {
  const { lang } = useLang();
  const tr = makeT(lang);
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  function mapError(msg: string): string {
    if (msg.includes("already registered") || msg.includes("User already registered"))
      return tr("auth_err_email_taken");
    // Show raw error in development to help diagnose config issues
    if (process.env.NODE_ENV === "development") return msg;
    return tr("auth_err_generic");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) return;
    setError(null);
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Display name stored in user_metadata — not in localStorage
        data: { full_name: name },
        // Supabase will send the OTP to this email
        emailRedirectTo: undefined, // we use OTP flow, not magic link
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(mapError(signUpError.message));
      return;
    }

    // Sync user into our own PostgreSQL users table so admin panel sees them
    await syncUserToDB({ email, fullName: name }).catch(() => {
      // non-critical: admin panel still works, just shows after next sync
    });

    setSuccess(true);
    // Pass email to verify page via query string (not localStorage)
    setTimeout(() => {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    }, 1200);
  }

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen flex items-center justify-center px-4 py-28"
        style={{ background: "var(--bg-base)" }}
      >
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(245,166,35,0.06) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 w-full max-w-md">
          <div
            className="rounded-2xl p-8 sm:p-10"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-gold)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: "rgba(245,166,35,0.10)",
                  border: "1px solid var(--border-gold)",
                }}
              >
                <Coffee size={22} color="#f5a623" />
              </div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {tr("auth_register")}
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Capito Coffee
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm"
                style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
              >
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Success banner */}
            {success && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm"
                style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}
              >
                <CheckCircle size={15} className="shrink-0" />
                {tr("auth_success_register")}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {tr("auth_name")}
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                  <input
                    id="name" type="text" autoComplete="name" required
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder={tr("auth_name_ph")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-gold)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {tr("auth_email")}
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                  <input
                    id="email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={tr("auth_email_ph")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-gold)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {tr("auth_password")}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                  <input
                    id="password" type={showPassword ? "text" : "password"}
                    autoComplete="new-password" required minLength={6}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder={tr("auth_password_ph")}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-gold)", color: "var(--text-primary)" }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }}
                    aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm-password" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {tr("auth_confirm_pw")}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                  <input
                    id="confirm-password" type={showConfirm ? "text" : "password"}
                    autoComplete="new-password" required
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={tr("auth_confirm_pw_ph")}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ background: "var(--bg-input)", border: `1px solid ${passwordMismatch ? "#ef4444" : "var(--border-gold)"}`, color: "var(--text-primary)" }}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }}
                    aria-label="Toggle confirm password visibility">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordMismatch && (
                  <p className="text-xs" style={{ color: "#ef4444" }}>Пароли не совпадают</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || passwordMismatch || success}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                style={{ background: "linear-gradient(135deg, #f5a623, #ffc84a)", color: "#0a0805" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {tr("auth_register")}…
                  </span>
                ) : tr("auth_register")}
              </button>
            </form>

            {/* Terms */}
            <p className="text-center text-xs mt-5 leading-relaxed" style={{ color: "var(--text-faint)" }}>
              {tr("auth_agree")}
              <span style={{ color: "#f5a623" }}>{tr("auth_terms")}</span>
              {tr("auth_and")}
              <span style={{ color: "#f5a623" }}>{tr("auth_privacy")}</span>
              {tr("auth_agree_end")}
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "var(--border-gold)" }} />
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{tr("auth_or")}</span>
              <div className="flex-1 h-px" style={{ background: "var(--border-gold)" }} />
            </div>

            <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
              {tr("auth_has_account")}{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: "#f5a623" }}>
                {tr("auth_login")}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
