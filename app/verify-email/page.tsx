"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useLang } from "../lang-provider";
import { makeT } from "../components/translations";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";

const RESEND_COOLDOWN = 60; // seconds

function VerifyEmailContent() {
  const { lang } = useLang();
  const tr = makeT(lang);
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  // 6 individual digit inputs
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Auto-focus first input on mount
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  function handleDigitChange(index: number, value: string) {
    // Allow paste of full 6-digit code
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      const arr = value.split("");
      setDigits(arr);
      inputRefs.current[5]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  const otp = digits.join("");

  const verify = useCallback(async () => {
    if (otp.length < 6) return;
    setError(null);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    setLoading(false);

    if (verifyError) {
      setError(tr("auth_err_invalid_otp"));
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
      return;
    }

    setVerified(true);
    setTimeout(() => router.push("/"), 1500);
  }, [email, otp, router, tr]);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (otp.length === 6 && !loading && !verified) verify();
  }, [otp, loading, verified, verify]);

  async function resend() {
    if (cooldown > 0) return;
    setResendMsg(null);
    setError(null);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (resendError) {
      setError(tr("auth_err_generic"));
    } else {
      setResendMsg(tr("verify_sent"));
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
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
                {verified
                  ? <CheckCircle size={22} color="#4ade80" />
                  : <MailCheck size={22} color="#f5a623" />}
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {tr("verify_title")}
              </h1>
              <p className="mt-2 text-sm text-center leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {tr("verify_desc")}{" "}
                <span className="font-semibold" style={{ color: "#f5a623" }}>{email}</span>
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

            {/* Success */}
            {(verified || resendMsg) && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm"
                style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}
              >
                <CheckCircle size={15} className="shrink-0" />
                {verified ? "Email подтверждён! Перенаправление…" : resendMsg}
              </div>
            )}

            {/* OTP digit inputs */}
            {!verified && (
              <>
                <div className="flex gap-2 justify-center mb-6">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={d}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onFocus={(e) => e.target.select()}
                      className="w-11 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all duration-200"
                      style={{
                        background: "var(--bg-input)",
                        border: `1px solid ${d ? "#f5a623" : "var(--border-gold)"}`,
                        color: "var(--text-primary)",
                        boxShadow: d ? "0 0 0 1px rgba(245,166,35,0.3)" : "none",
                      }}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={verify}
                  disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #f5a623, #ffc84a)", color: "#0a0805" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {tr("verify_btn")}…
                    </span>
                  ) : tr("verify_btn")}
                </button>

                {/* Resend */}
                <div className="flex flex-col items-center gap-2 mt-6">
                  <button
                    type="button"
                    onClick={resend}
                    disabled={cooldown > 0}
                    className="flex items-center gap-1.5 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: cooldown > 0 ? "var(--text-faint)" : "#f5a623" }}
                  >
                    <RefreshCw size={14} />
                    {cooldown > 0
                      ? `${tr("verify_resend_in")} ${cooldown}${tr("verify_sec")}`
                      : tr("verify_resend")}
                  </button>

                  <a
                    href="/register"
                    className="text-xs hover:underline"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {tr("verify_wrong_email")} {tr("verify_back")}
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
