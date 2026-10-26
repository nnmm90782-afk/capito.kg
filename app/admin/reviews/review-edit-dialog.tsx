"use client";

import { useState } from "react";
import { editReview } from "@/app/admin/actions";
import { Edit3, X, Save, Star } from "lucide-react";

interface Review {
  id: string;
  text: string | null;
  rating: number;
}

export default function ReviewEditDialog({ review }: { review: Review }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(review.text ?? "");
  const [rating, setRating] = useState(review.rating);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all hover:scale-[1.03]"
        style={{ borderColor: "#f5a623", color: "#f5a623", background: "#f5a62310" }}
      >
        <Edit3 size={12} />
        Редактировать
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border p-6"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", boxShadow: "var(--shadow-glow)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                Редактирование отзыва
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ color: "var(--text-faint)", background: "var(--bg-base)" }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Rating */}
            <div className="mb-4">
              <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-muted)" }}>
                Оценка
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    className="p-1"
                  >
                    <Star
                      size={22}
                      fill={i <= rating ? "#f5a623" : "none"}
                      color={i <= rating ? "#f5a623" : "var(--border-gold)"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Text */}
            <div className="mb-5">
              <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-muted)" }}>
                Текст отзыва
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border-gold)" }}
              >
                Отмена
              </button>
              <form action={editReview}>
                <input type="hidden" name="id" value={review.id} />
                <input type="hidden" name="text" value={text} />
                <input type="hidden" name="rating" value={rating} />
                <button
                  type="submit"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
                >
                  <Save size={14} />
                  Сохранить
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
