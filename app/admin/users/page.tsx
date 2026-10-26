import { query } from "@/lib/db";
import { blockUser, unblockUser, syncUserToDB } from "@/app/admin/actions";
import {
  Users as UsersIcon, Ban, CheckCircle, Mail, Phone, Shield, ShieldOff, UserPlus, Info,
} from "lucide-react";

// Admin page: live data from DB, rendered on demand.
export const instant = false;

interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string;
  created_at: string;
  last_login_at: string | null;
  orders_count: string;
  total_spent: string;
}

async function getUsers(): Promise<UserRow[]> {
  return query<UserRow>(`
    SELECT
      u.id, u.email, u.phone, u.first_name, u.last_name, u.status,
      TO_CHAR(u.created_at, 'DD.MM.YYYY') AS created_at,
      TO_CHAR(u.last_login_at, 'DD.MM.YYYY HH24:MI') AS last_login_at,
      COALESCE(COUNT(o.id), 0)::text AS orders_count,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.payment_status = 'PAID'), 0)::text AS total_spent
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    WHERE u.deleted_at IS NULL
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);
}

// Server Action — ручное добавление пользователя по email
async function addUserManually(formData: FormData): Promise<void> {
  "use server";
  const email    = String(formData.get("email")     ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName")  ?? "").trim();
  if (!email) return;
  await syncUserToDB({ email, fullName });
}

function fmt(n: string | number) {
  return Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 0 });
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function AdminUsersPage() {
  const users = await getUsers();

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
  const blockedUsers = users.filter((u) => u.status === "BLOCKED").length;

  return (
    <div className="p-8 space-y-6" style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>Пользователи</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
          Аккаунты клиентов и управление доступом
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Всего", value: totalUsers, color: "#f5a623", icon: UsersIcon },
          { label: "Активные", value: activeUsers, color: "#4ade80", icon: CheckCircle },
          { label: "Заблокированные", value: blockedUsers, color: "#f87171", icon: Ban },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border p-4 flex items-center gap-4"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}18` }}
            >
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{s.value}</div>
              <div className="text-xs" style={{ color: "var(--text-faint)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Info — sync tip */}
      <div
        className="rounded-2xl border p-4 flex items-start gap-3"
        style={{ background: "rgba(245,166,35,0.06)", borderColor: "rgba(245,166,35,0.25)" }}
      >
        <Info size={16} style={{ color: "#f5a623", flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold mb-0.5" style={{ color: "#f5a623" }}>
            Автосинхронизация с Supabase
          </p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            Пользователи автоматически появляются здесь после регистрации или входа на сайте.
            Если нужно добавить пользователя вручную — введите его email ниже.
          </p>
        </div>

        {/* Manual add form */}
        <form action={addUserManually} className="flex items-center gap-2 flex-shrink-0">
          <input
            type="email"
            name="email"
            required
            placeholder="email@example.com"
            className="px-3 py-2 rounded-xl border text-xs outline-none w-48"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
          />
          <input
            type="text"
            name="fullName"
            placeholder="Имя (опционально)"
            className="px-3 py-2 rounded-xl border text-xs outline-none w-36"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.03] whitespace-nowrap"
            style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
          >
            <UserPlus size={13} />
            Добавить
          </button>
        </form>
      </div>

      {/* Users table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
      >
        {/* Table header */}
        <div
          className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.2fr_auto] gap-4 px-5 py-3 border-b text-[11px] font-bold uppercase tracking-wider"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-faint)" }}
        >
          <span>Пользователь</span>
          <span>Контакты</span>
          <span>Заказов</span>
          <span>Потрачено</span>
          <span>Статус</span>
          <span className="text-right">Действие</span>
        </div>

        {/* Rows */}
        <div className="flex flex-col">
          {users.length === 0 && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--text-faint)" }}>
              Нет пользователей
            </div>
          )}
          {users.map((u) => {
            const isBlocked = u.status === "BLOCKED";
            const statusColor = isBlocked ? "#f87171" : "#4ade80";
            return (
              <div
                key={u.id}
                className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1.2fr_auto] gap-4 px-5 py-4 border-b items-center"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                {/* User */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
                    style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
                  >
                    {(u.first_name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {[u.first_name, u.last_name].filter(Boolean).join(" ") || "Без имени"}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                      Регистрация: {u.created_at}
                    </div>
                  </div>
                </div>

                {/* Contacts */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  {u.email && (
                    <span className="flex items-center gap-1.5 text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      <Mail size={11} style={{ color: "var(--text-faint)" }} />
                      <span className="truncate">{u.email}</span>
                    </span>
                  )}
                  {u.phone && (
                    <span className="flex items-center gap-1.5 text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      <Phone size={11} style={{ color: "var(--text-faint)" }} />
                      {u.phone}
                    </span>
                  )}
                </div>

                {/* Orders count */}
                <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {u.orders_count}
                </div>

                {/* Spent */}
                <div className="text-sm font-bold" style={{ color: "#f5a623" }}>
                  {fmt(u.total_spent)} сом
                </div>

                {/* Status */}
                <div>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                    style={{ background: `${statusColor}18`, color: statusColor }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                    {isBlocked ? "Заблокирован" : "Активен"}
                  </span>
                </div>

                {/* Action */}
                <div className="flex justify-start md:justify-end">
                  {isBlocked ? (
                    <form action={unblockUser}>
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full border transition-all hover:scale-[1.03]"
                        style={{ borderColor: "#4ade80", color: "#4ade80", background: "#4ade8010" }}
                      >
                        <Shield size={13} />
                        Разблокировать
                      </button>
                    </form>
                  ) : (
                    <form action={blockUser}>
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full border transition-all hover:scale-[1.03]"
                        style={{ borderColor: "#f87171", color: "#f87171", background: "#f8717110" }}
                      >
                        <ShieldOff size={13} />
                        Заблокировать
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
