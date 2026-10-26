"use client";

// Fetches published reviews from /api/reviews (server-side pg stays in Route Handler).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, ChevronRight, MessageSquare } from "lucide-react";

interface ReviewRow {
  id: string;
  user_name: string;
  rating: number;
  text: string | null;
}

const FALLBACK: ReviewRow[] = [
  { id: "f1", user_name: "Айгуль М.", rating: 5, text: "Лучший кофе в Бишкеке! Атмосфера великолепная, персонал всегда доброжелателен." },
  { id: "f2", user_name: "Руслан К.", rating: 5, text: "Раф кофе — просто шедевр. Интерьер очень стильный, быстрая доставка тоже радует." },
  { id: "f3", user_name: "Диана Т.",  rating: 5, text: "Наконец кофейня с достойным уровнем сервиса. Круассаны свежие каждое утро!" },
];

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<ReviewRow[]>(FALLBACK);
  const [isReal,  setIsReal]  = useState(false);

  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then((data: ReviewRow[]) => {
        if (data && data.length > 0) {
          setReviews(data);
          setIsReal(true);
        }
      })
      .catch(() => {/* keep fallback */});
  }, []);

  return (
    <section className="py-24" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-semibold tracking-[0.25em] uppercase block mb-3" style={{ color: "#f5a623" }}>
              Отзывы гостей
            </span>
            <h2 className="text-4xl font-black" style={{ color: "var(--text-primary)" }}>
              Что говорят <span className="text-gold-gradient">наши гости</span>
            </h2>
            {isReal && (
              <p className="text-sm mt-2" style={{ color: "var(--text-faint)" }}>
                {reviews.length} реальных отзывов от посетителей
              </p>
            )}
          </div>
          <Link
            href="/reviews"
            className="flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
            style={{ color: "#f5a623" }}
          >
            Все отзывы <ChevronRight size={16} />
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map((r) => (
            <div
              key={r.id}
              className="card-hover card-depth rounded-2xl border p-7 flex flex-col gap-5"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < r.rating ? "#f5a623" : "none"}
                    color={i < r.rating ? "#f5a623" : "var(--border-gold)"}
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed flex-1 line-clamp-4" style={{ color: "var(--text-muted)" }}>
                &ldquo;{r.text ?? "Отличный опыт!"}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "var(--border-gold)" }}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-black font-black text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)" }}
                >
                  {r.user_name[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {r.user_name}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full border text-sm font-semibold transition-all hover:bg-[#f5a623] hover:text-black hover:border-[#f5a623]"
            style={{ borderColor: "rgba(245,166,35,0.35)", background: "rgba(245,166,35,0.06)", color: "#f5a623" }}
          >
            <MessageSquare size={15} />
            Оставить отзыв
          </Link>
        </div>
      </div>
    </section>
  );
}
