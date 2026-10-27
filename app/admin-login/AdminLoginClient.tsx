"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Mail, Lock, Eye, EyeOff, ShieldX } from "lucide-react";

export default function AdminLoginClient() {
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res  = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Вам вход запрещён");
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}
    >
      {/* subtle glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(245,166,35,0.06) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
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
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Вход в панель администратора
            </h1>
            <p className="mt-1 text-xs font-semibold tracking-widest" style={{ color: "var(--gold, #f5a623)" }}>
              CAPITO · ADMIN
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm font-semibold"
              style={{
                background: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171",
              }}
            >
              <ShieldX size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-faint)" }}
                />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-gold)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Пароль
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-faint)" }}
                />
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-11 py-3 text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-gold)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-faint)" }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg,#f5a623,#c47d0e)",
                color: "#000",
              }}
            >
              {loading ? "Проверка…" : "Войти"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
