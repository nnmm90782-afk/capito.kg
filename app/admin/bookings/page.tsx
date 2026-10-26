import { query } from "@/lib/db";
import {
  confirmBooking,
  cancelBooking,
  completeBooking,
  markNoShow,
} from "@/app/admin/actions";
import {
  CalendarDays, Users, Clock, CheckCircle, XCircle,
  AlertCircle, MapPin, MessageSquare, Phone, Mail,
} from "lucide-react";

// Admin page: live data from DB, rendered on demand.
export const instant = false;

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingRow {
  id: string;
  booking_number: string;
  status: string;
  guest_count: number;
  date: string;          // formatted
  start_time: string;    // HH:MM
  end_time: string | null;
  comment: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  // user
  user_name: string;
  user_email: string | null;
  user_phone: string | null;
  // branch
  branch_name: string | null;
}

// ─── DB query ─────────────────────────────────────────────────────────────────

async function getBookings(): Promise<BookingRow[]> {
  return query<BookingRow>(`
    SELECT
      bk.id,
      bk.booking_number,
      bk.status,
      bk.guest_count,
      TO_CHAR(bk.date,       'DD.MM.YYYY')    AS date,
      TO_CHAR(bk.start_time, 'HH24:MI')       AS start_time,
      TO_CHAR(bk.end_time,   'HH24:MI')       AS end_time,
      bk.comment,
      TO_CHAR(bk.confirmed_at, 'DD.MM HH24:MI') AS confirmed_at,
      TO_CHAR(bk.cancelled_at, 'DD.MM HH24:MI') AS cancelled_at,
      TO_CHAR(bk.created_at,   'DD.MM.YYYY HH24:MI') AS created_at,
      COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), 'Без имени') AS user_name,
      u.email  AS user_email,
      u.phone  AS user_phone,
      br.name  AS branch_name
    FROM bookings bk
    JOIN    users    u  ON u.id  = bk.user_id
    LEFT JOIN branches br ON br.id = bk.branch_id
    ORDER BY
      CASE bk.status
        WHEN 'PENDING'   THEN 0
        WHEN 'CONFIRMED' THEN 1
        WHEN 'COMPLETED' THEN 2
        WHEN 'NO_SHOW'   THEN 3
        WHEN 'CANCELLED' THEN 4
      END,
      bk.date,
      bk.start_time
  `);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Ожидает",
  CONFIRMED: "Подтверждено",
  COMPLETED: "Завершено",
  CANCELLED: "Отменено",
  NO_SHOW:   "Не пришли",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "#fbbf24",
  CONFIRMED: "#4ade80",
  COMPLETED: "#60a5fa",
  CANCELLED: "#f87171",
  NO_SHOW:   "#9ca3af",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  PENDING:   Clock,
  CONFIRMED: CheckCircle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
  NO_SHOW:   AlertCircle,
};

// Кнопки доступных действий по текущему статусу
const ACTIONS: Record<string, { label: string; action: (fd: FormData) => Promise<void>; color: string }[]> = {
  PENDING: [
    { label: "Подтвердить",  action: confirmBooking, color: "#4ade80" },
    { label: "Отменить",     action: cancelBooking,  color: "#f87171" },
  ],
  CONFIRMED: [
    { label: "Завершить",    action: completeBooking, color: "#60a5fa" },
    { label: "Не пришли",   action: markNoShow,      color: "#9ca3af" },
    { label: "Отменить",    action: cancelBooking,   color: "#f87171" },
  ],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW:   [],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminBookingsPage() {
  const bookings = await getBookings();

  const pending   = bookings.filter(b => b.status === "PENDING").length;
  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length;
  const completed = bookings.filter(b => b.status === "COMPLETED").length;
  const cancelled = bookings.filter(b => b.status === "CANCELLED").length;
  const noShow    = bookings.filter(b => b.status === "NO_SHOW").length;

  return (
    <div className="p-8 space-y-6" style={{ background: "var(--bg-base)", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
          Бронирования столов
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
          Управление бронями — подтверждайте, завершайте или отменяйте
        </p>
      </div>

      {/* ── Summary ── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { label: "Ожидают",      value: pending,   color: "#fbbf24" },
          { label: "Подтверждено", value: confirmed,  color: "#4ade80" },
          { label: "Завершено",    value: completed,  color: "#60a5fa" },
          { label: "Отменено",     value: cancelled,  color: "#f87171" },
          { label: "Не пришли",    value: noShow,     color: "#9ca3af" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: s.color }}
            />
            <div>
              <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bookings list ── */}
      <div className="flex flex-col gap-3">
        {bookings.length === 0 && (
          <div
            className="rounded-2xl border p-12 text-center"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", color: "var(--text-faint)" }}
          >
            <CalendarDays size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
            Бронирований нет
          </div>
        )}

        {bookings.map((b) => {
          const Icon       = STATUS_ICON[b.status] ?? Clock;
          const statusColor = STATUS_COLORS[b.status] ?? "#f5a623";
          const actions    = ACTIONS[b.status] ?? [];
          const isActive   = b.status === "PENDING" || b.status === "CONFIRMED";

          return (
            <div
              key={b.id}
              className="rounded-2xl border overflow-hidden"
              style={{
                background: "var(--bg-card)",
                borderColor: isActive ? "var(--border-gold)" : "var(--border-subtle)",
                opacity: isActive ? 1 : 0.75,
              }}
            >
              {/* ── Top row ── */}
              <div className="px-5 py-4 flex flex-wrap items-start gap-4">

                {/* Status icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${statusColor}18` }}
                >
                  <Icon size={18} style={{ color: statusColor }} />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: номер + статус + дата */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm" style={{ color: "var(--text-primary)" }}>
                      {b.booking_number}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: `${statusColor}18`, color: statusColor }}
                    >
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                  </div>

                  {/* Row 2: дата, время, гостей, филиал */}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <CalendarDays size={12} style={{ color: "#f5a623" }} />
                      {b.date}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Clock size={12} style={{ color: "var(--text-faint)" }} />
                      {b.start_time}{b.end_time ? ` — ${b.end_time}` : ""}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Users size={12} style={{ color: "var(--text-faint)" }} />
                      {b.guest_count} {b.guest_count === 1 ? "гость" : b.guest_count < 5 ? "гостя" : "гостей"}
                    </span>
                    {b.branch_name && (
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        <MapPin size={12} style={{ color: "var(--text-faint)" }} />
                        {b.branch_name}
                      </span>
                    )}
                  </div>

                  {/* Comment */}
                  {b.comment && (
                    <div className="flex items-start gap-1.5 mt-1.5">
                      <MessageSquare size={11} style={{ color: "var(--text-faint)", marginTop: 2, flexShrink: 0 }} />
                      <span className="text-[11px] italic" style={{ color: "var(--text-faint)" }}>
                        {b.comment}
                      </span>
                    </div>
                  )}
                </div>

                {/* User card */}
                <div
                  className="flex-shrink-0 rounded-xl border px-4 py-3 flex flex-col gap-1 min-w-[180px]"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border-subtle)" }}
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
                    >
                      {b.user_name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                      {b.user_name}
                    </span>
                  </div>
                  {b.user_email && (
                    <span className="flex items-center gap-1.5 text-[11px] truncate" style={{ color: "var(--text-faint)" }}>
                      <Mail size={10} />
                      {b.user_email}
                    </span>
                  )}
                  {b.user_phone && (
                    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
                      <Phone size={10} />
                      {b.user_phone}
                    </span>
                  )}
                  <span className="text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                    Создано: {b.created_at}
                  </span>
                  {b.confirmed_at && (
                    <span className="text-[10px]" style={{ color: "#4ade80" }}>
                      ✓ Подтверждено: {b.confirmed_at}
                    </span>
                  )}
                  {b.cancelled_at && (
                    <span className="text-[10px]" style={{ color: "#f87171" }}>
                      ✗ Отменено: {b.cancelled_at}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Action buttons ── */}
              {actions.length > 0 && (
                <div
                  className="px-5 py-3 flex items-center gap-2 flex-wrap border-t"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--bg-base)" }}
                >
                  <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                    Действие:
                  </span>
                  {actions.map(({ label, action, color }) => (
                    <form key={label} action={action}>
                      <input type="hidden" name="id" value={b.id} />
                      <button
                        type="submit"
                        className="text-[11px] font-bold px-4 py-1.5 rounded-full border transition-all hover:scale-[1.03]"
                        style={{
                          borderColor: color,
                          color: color,
                          background: `${color}10`,
                        }}
                      >
                        {label}
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
