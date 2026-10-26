"use client";

import { useState } from "react";
import { PageShell } from "../components/page-shell";
import { Star, Send, CheckCircle, MessageSquare, User, Mail, ChevronDown } from "lucide-react";

export interface ReviewItem {
  id: string;
  user_name: string;
  branch_name: string | null;
  rating: number;
  text: string | null;
  created_at: string;
}

export interface BranchItem { slug: string; name: string }

const ACCENT = "#f5a623";

function Stars({
  value,
  onChange,
  size = 28,
  interactive = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  interactive?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? "transition-transform hover:scale-110" : ""}
        >
          <Star
            size={size}
            fill={i <= display ? ACCENT : "none"}
            color={i <= display ? ACCENT : "var(--border-gold)"}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <div
      className="card-hover rounded-2xl border p-6 flex flex-col gap-4"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
          >
            {review.user_name[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
              {review.user_name}
            </div>
            {review.branch_name && (
              <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>{review.branch_name}</div>
            )}
          </div>
        </div>
        <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-faint)" }}>{review.created_at}</span>
      </div>

      <Stars value={review.rating} size={14} />

      {review.text && (
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          &ldquo;{review.text}&rdquo;
        </p>
      )}
    </div>
  );
}

export default function ReviewsClient({
  reviews,
  branches,
}: {
  reviews: ReviewItem[];
  branches: BranchItem[];
}) {
  // Form state
  const [rating,     setRating]     = useState(5);
  const [text,       setText]       = useState("");
  const [userName,   setUserName]   = useState("");
  const [userEmail,  setUserEmail]  = useState("");
  const [branchSlug, setBranchSlug] = useState(branches[0]?.slug ?? "");
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");
  const [pending,    setPending]    = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    fetch("/api/reviews/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, text, userName, userEmail, branchSlug }),
    })
      .then(r => r.json())
      .then((data: { ok: boolean; error?: string }) => {
        setPending(false);
        if (data.ok) {
          setSuccess(true);
          setText(""); setUserName(""); setUserEmail(""); setRating(5);
        } else {
          setError(data.error ?? "Ошибка. Попробуйте ещё раз.");
        }
      })
      .catch(() => {
        setPending(false);
        setError("Ошибка соединения. Попробуйте снова.");
      });
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <PageShell>
      {/* ── Hero ── */}
      <section className="py-20 relative overflow-hidden" style={{ background: "var(--bg-base)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--hero-radial)" }} />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="divider-gold" />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: ACCENT }}>
              Отзывы гостей
            </span>
          </div>
          <h1 className="text-5xl font-black leading-none mb-4" style={{ color: "var(--text-primary)" }}>
            Что говорят{" "}<span className="text-gold-gradient">наши гости</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Реальные отзывы наших клиентов. Оставьте свой — нам важно ваше мнение.
          </p>

          {/* Stat pills */}
          <div className="flex items-center gap-4 mt-6 flex-wrap">
            <div
              className="flex items-center gap-2.5 px-4 py-2 rounded-full border"
              style={{ background: "rgba(245,166,35,0.08)", borderColor: "rgba(245,166,35,0.3)" }}
            >
              <Star size={14} fill={ACCENT} color={ACCENT} />
              <span className="font-black text-sm" style={{ color: ACCENT }}>{avgRating}</span>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>средняя оценка</span>
            </div>
            <div
              className="flex items-center gap-2.5 px-4 py-2 rounded-full border"
              style={{ background: "rgba(245,166,35,0.08)", borderColor: "rgba(245,166,35,0.3)" }}
            >
              <MessageSquare size={14} style={{ color: ACCENT }} />
              <span className="font-black text-sm" style={{ color: ACCENT }}>{reviews.length}</span>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>отзывов</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="py-14" style={{ background: "var(--bg-surface)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">

            {/* ── Left: reviews list ── */}
            <div className="space-y-5">
              <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
                Все отзывы
              </h2>

              {reviews.length === 0 ? (
                <div
                  className="rounded-2xl border p-12 text-center"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
                >
                  <MessageSquare size={32} style={{ margin: "0 auto 10px", color: "var(--text-faint)" }} />
                  <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                    Пока нет отзывов. Будьте первым!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: leave review form ── */}
            <div className="lg:sticky lg:top-24">
              <div
                className="rounded-2xl border p-6 space-y-5"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", boxShadow: "var(--shadow-card)" }}
              >
                <h3 className="text-lg font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <MessageSquare size={18} style={{ color: ACCENT }} />
                  Оставить отзыв
                </h3>

                {success ? (
                  /* ── Success state ── */
                  <div className="py-6 text-center space-y-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                      style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", boxShadow: "0 0 20px rgba(74,222,128,0.3)" }}
                    >
                      <CheckCircle size={26} color="#000" />
                    </div>
                    <div>
                      <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                        Спасибо за отзыв!
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                        Ваш отзыв отправлен на проверку и скоро появится на сайте.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSuccess(false)}
                      className="px-5 py-2 rounded-full text-xs font-bold border transition-all hover:scale-[1.03]"
                      style={{ borderColor: "var(--border-gold)", color: ACCENT }}
                    >
                      Написать ещё
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Rating */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        Оценка <span style={{ color: ACCENT }}>*</span>
                      </label>
                      <Stars value={rating} onChange={setRating} size={30} interactive />
                      <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                        {["", "Ужасно", "Плохо", "Нормально", "Хорошо", "Отлично"][rating]}
                      </p>
                    </div>

                    {/* Branch */}
                    {branches.length > 1 && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                          Филиал
                        </label>
                        <div className="relative">
                          <select
                            value={branchSlug}
                            onChange={e => setBranchSlug(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border text-sm appearance-none outline-none pr-8"
                            style={{ background: "var(--bg-base)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                          >
                            {branches.map(b => (
                              <option key={b.slug} value={b.slug}>{b.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                        </div>
                      </div>
                    )}

                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        <User size={11} className="inline mr-1" />
                        Ваше имя
                      </label>
                      <input
                        type="text"
                        placeholder="Асан Сыдыков"
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                        style={{ background: "var(--bg-base)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        <Mail size={11} className="inline mr-1" />
                        Email <span style={{ color: ACCENT }}>*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={userEmail}
                        onChange={e => setUserEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                        style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
                      />
                    </div>

                    {/* Text */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        Ваш отзыв <span style={{ color: ACCENT }}>*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Расскажите о своих впечатлениях..."
                        value={text}
                        onChange={e => setText(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                        style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
                      />
                      <p className="text-[10px] text-right" style={{ color: "var(--text-faint)" }}>
                        {text.length} символов
                      </p>
                    </div>

                    {error && (
                      <div
                        className="px-3 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: "#f8717118", color: "#f87171", border: "1px solid #f8717130" }}
                      >
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={pending || !userEmail || !text}
                      className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:scale-[1.01]"
                      style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
                    >
                      {pending ? (
                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      {pending ? "Отправка..." : "Отправить отзыв"}
                    </button>

                    <p className="text-[10px] text-center" style={{ color: "var(--text-faint)" }}>
                      Отзыв проходит модерацию перед публикацией
                    </p>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </PageShell>
  );
}
