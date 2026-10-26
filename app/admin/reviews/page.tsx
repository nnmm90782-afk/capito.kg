import { query } from "@/lib/db";
import { deleteReview, hideReview, publishReview } from "@/app/admin/actions";
import { Star, Trash2, EyeOff, Eye, MessageSquare } from "lucide-react";
import ReviewEditDialog from "./review-edit-dialog";

// Admin page: live data from DB, rendered on demand.
export const instant = false;

interface ReviewRow {
  id: string;
  user_name: string;
  user_email: string | null;
  branch_name: string | null;
  rating: number;
  text: string | null;
  status: string;
  created_at: string;
}

async function getReviews(): Promise<ReviewRow[]> {
  return query<ReviewRow>(`
    SELECT
      r.id, r.rating, r.text, r.status,
      COALESCE(NULLIF(CONCAT(u.first_name, ' ', u.last_name), ' '), 'Без имени') AS user_name,
      u.email AS user_email,
      b.name AS branch_name,
      TO_CHAR(r.created_at, 'DD.MM.YYYY HH24:MI') AS created_at
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    LEFT JOIN branches b ON b.id = r.branch_id
    WHERE r.status != 'DELETED'
    ORDER BY
      CASE r.status WHEN 'PENDING' THEN 0 WHEN 'HIDDEN' THEN 1 ELSE 2 END,
      r.created_at DESC
  `);
}

// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING: "На модерации", PUBLISHED: "Опубликован", HIDDEN: "Скрыт", DELETED: "Удалён",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#fbbf24", PUBLISHED: "#4ade80", HIDDEN: "#9ca3af", DELETED: "#f87171",
};

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= rating ? "#f5a623" : "none"}
          color={i <= rating ? "#f5a623" : "var(--border-gold)"}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function AdminReviewsPage() {
  const reviews = await getReviews();

  const pending = reviews.filter((r) => r.status === "PENDING").length;
  const published = reviews.filter((r) => r.status === "PUBLISHED").length;
  const hidden = reviews.filter((r) => r.status === "HIDDEN").length;

  return (
    <div className="p-8 space-y-6" style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>Отзывы</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
          Модерация отзывов пользователей
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Всего", value: reviews.length, color: "#f5a623" },
          { label: "На модерации", value: pending, color: "#fbbf24" },
          { label: "Опубликовано", value: published, color: "#4ade80" },
          { label: "Скрыто", value: hidden, color: "#9ca3af" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border p-4"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
          >
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Reviews list */}
      <div className="flex flex-col gap-3">
        {reviews.length === 0 && (
          <div
            className="rounded-2xl border p-10 text-center text-sm"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", color: "var(--text-faint)" }}
          >
            <MessageSquare size={28} style={{ margin: "0 auto 8px", color: "var(--text-faint)" }} />
            Отзывов нет
          </div>
        )}
        {reviews.map((r) => {
          const statusColor = STATUS_COLORS[r.status] ?? "#f5a623";
          return (
            <div
              key={r.id}
              className="rounded-2xl border p-5"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
                    style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
                  >
                    {r.user_name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      {r.user_name}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Stars rating={r.rating} />
                      {r.branch_name && (
                        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                          · {r.branch_name}
                        </span>
                      )}
                      <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>· {r.created_at}</span>
                    </div>
                  </div>
                </div>

                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: `${statusColor}18`, color: statusColor }}
                >
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
              </div>

              {/* Text */}
              {r.text && (
                <p
                  className="text-sm mt-3 leading-relaxed"
                  style={{
                    color: "var(--text-muted)",
                    fontStyle: r.rating <= 2 ? "italic" : "normal",
                    opacity: r.status === "HIDDEN" ? 0.6 : 1,
                  }}
                >
                  {r.text}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {r.status !== "PUBLISHED" && (
                  <form action={publishReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all hover:scale-[1.03]"
                      style={{ borderColor: "#4ade80", color: "#4ade80", background: "#4ade8010" }}
                    >
                      <Eye size={12} />
                      Показать
                    </button>
                  </form>
                )}
                {r.status !== "HIDDEN" && (
                  <form action={hideReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all hover:scale-[1.03]"
                      style={{ borderColor: "#9ca3af", color: "#9ca3af", background: "#9ca3af10" }}
                    >
                      <EyeOff size={12} />
                      Скрыть
                    </button>
                  </form>
                )}
                <ReviewEditDialog review={r} />
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all hover:scale-[1.03]"
                    style={{ borderColor: "#f87171", color: "#f87171", background: "#f8717110" }}
                  >
                    <Trash2 size={12} />
                    Удалить
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
