"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Coffee, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { syncUserToDB } from "../admin/actions";
import { useLang } from "../lang-provider";
import { makeT } from "../components/translations";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";

export default function LoginPage() {
  const { lang } = useLang();
  const tr = makeT(lang);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function mapError(msg: string): string {
    if (msg.includes("Email not confirmed"))
      return tr("auth_err_not_confirmed");
    if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials"))
      return tr("auth_err_wrong_pw");
    return tr("auth_err_generic");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(mapError(signInError.message));
      return;
    }

    // Extra guard: block login if email is not confirmed
    if (!data.user?.email_confirmed_at) {
      // Sign the user back out so the session is not persisted
      await supabase.auth.signOut();
      setError(tr("auth_err_not_confirmed"));
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      return;
    }

    router.push("/");
    router.refresh();

    // Sync user into our PostgreSQL users table (idempotent — safe to call every login)
    if (data.user?.email) {
      const fullName = (data.user.user_metadata?.full_name as string | undefined) ?? "";
      syncUserToDB({ email: data.user.email, fullName }).catch(() => {});
    }
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
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {tr("auth_login")}
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Capito Coffee
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm"
                style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
              >
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    {tr("auth_password")}
                  </label>
                  <button type="button" className="text-xs hover:underline" style={{ color: "#f5a623" }}>
                    {tr("auth_forgot")}
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                  <input
                    id="password" type={showPassword ? "text" : "password"}
                    autoComplete="current-password" required
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                style={{ background: "linear-gradient(135deg, #f5a623, #ffc84a)", color: "#0a0805" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {tr("auth_login")}…
                  </span>
                ) : tr("auth_login")}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: "var(--border-gold)" }} />
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{tr("auth_or")}</span>
              <div className="flex-1 h-px" style={{ background: "var(--border-gold)" }} />
            </div>

            <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
              {tr("auth_no_account")}{" "}
              <Link href="/register" className="font-semibold hover:underline" style={{ color: "#f5a623" }}>
                {tr("auth_register")}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
