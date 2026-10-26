import { query } from "@/lib/db";
import {
  ShoppingBag, Banknote, Users, Star, TrendingUp,
  CheckCircle, Clock, XCircle, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

// Admin pages access live DB data — render on demand, no prerender.
export const instant = false;

// ── Types ────────────────────────────────────────────────────────────────────

interface StatRow {
  total_orders: string;
  completed_orders: string;
  total_revenue: string;
  avg_order: string;
}
interface DayRow { day: string; revenue: string; orders: string }
interface StatusRow { status: string; cnt: string }
interface TopRow { product_name: string; qty: string; revenue: string }
interface UserRow { total_users: string; active_users: string; blocked_users: string }
interface RecentOrder {
  id: string; order_number: string; customer_name: string;
  status: string; total_amount: string; created_at: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────
//
// "Выручка" = сумма total_amount у COMPLETED-заказов.
// Когда админ жмёт «Выполнен» → статус становится COMPLETED и payment_status = PAID.
// Все цифры на дашборде отражают только реально завершённые заказы.

async function getStats() {
  const [stat] = await query<StatRow>(`
    SELECT
      COUNT(*)::text                                          AS total_orders,
      COUNT(*) FILTER (WHERE status = 'COMPLETED')::text     AS completed_orders,
      COALESCE(
        SUM(total_amount) FILTER (WHERE status = 'COMPLETED'), 0
      )::text                                                AS total_revenue,
      COALESCE(
        AVG(total_amount) FILTER (WHERE status = 'COMPLETED'), 0
      )::text                                                AS avg_order
    FROM orders
  `);
  return stat;
}

async function getWeekRevenue() {
  return query<DayRow>(`
    SELECT
      TO_CHAR(completed_at, 'DD.MM')                                   AS day,
      COALESCE(SUM(total_amount), 0)::text                             AS revenue,
      COUNT(*)::text                                                    AS orders
    FROM orders
    WHERE status = 'COMPLETED'
      AND completed_at >= now() - interval '7 days'
    GROUP BY TO_CHAR(completed_at, 'DD.MM')
    ORDER BY MIN(completed_at)
  `);
}

async function getStatusBreakdown() {
  return query<StatusRow>(`
    SELECT status, COUNT(*)::text AS cnt
    FROM orders
    GROUP BY status
    ORDER BY COUNT(*) DESC
  `);
}

async function getTopProducts() {
  return query<TopRow>(`
    SELECT
      oi.product_name,
      SUM(oi.quantity)::text   AS qty,
      SUM(oi.total_price)::text AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'COMPLETED'
    GROUP BY oi.product_name
    ORDER BY SUM(oi.quantity) DESC
    LIMIT 5
  `);
}

async function getUserStats() {
  const [row] = await query<UserRow>(`
    SELECT
      COUNT(*)::text AS total_users,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')::text AS active_users,
      COUNT(*) FILTER (WHERE status = 'BLOCKED')::text AS blocked_users
    FROM users
  `);
  return row;
}

async function getRecentOrders() {
  return query<RecentOrder>(`
    SELECT id, order_number, customer_name, status, total_amount,
           TO_CHAR(created_at, 'DD.MM HH24:MI') AS created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 8
  `);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новый", ACCEPTED: "Принят", PREPARING: "Готовится",
  READY: "Готов", COMPLETED: "Выполнен", CANCELLED: "Отменён",
  DELIVERED: "Доставлен", IN_TRANSIT: "В пути",
};
const STATUS_COLORS: Record<string, string> = {
  NEW: "#60a5fa", ACCEPTED: "#a78bfa", PREPARING: "#fbbf24",
  READY: "#34d399", COMPLETED: "#4ade80", CANCELLED: "#f87171",
  DELIVERED: "#4ade80", IN_TRANSIT: "#38bdf8",
};

function fmt(n: string | number) {
  return Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 0 });
}

// ── Components ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, accent = "#f5a623",
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; accent?: string;
}) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-3"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18` }}
        >
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>{value}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{sub}</div>}
      </div>
    </div>
  );
}

// Simple bar: width proportional to max value
function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return (
    <div className="h-1.5 rounded-full" style={{ background: "var(--border-subtle)", overflow: "hidden" }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: "linear-gradient(90deg,#f5a623,#ffc84a)" }}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const [stats, weekData, statusBreak, topProducts, userStats, recentOrders] = await Promise.all([
    getStats(), getWeekRevenue(), getStatusBreakdown(), getTopProducts(),
    getUserStats(), getRecentOrders(),
  ]);

  const maxRevenue = Math.max(...weekData.map((d) => Number(d.revenue)), 1);
  const maxBar = Math.max(...topProducts.map((p) => Number(p.qty)), 1);

  const completionRate =
    Number(stats.total_orders) > 0
      ? Math.round((Number(stats.completed_orders) / Number(stats.total_orders)) * 100)
      : 0;

  return (
    <div className="p-8 space-y-8" style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            Аналитика
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
            Общая статистика по всем филиалам
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
          style={{ background: "rgba(245,166,35,0.1)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.25)" }}
        >
          <TrendingUp size={12} />
          Live данные
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Всего заказов"
          value={fmt(stats.total_orders)}
          sub={`${stats.completed_orders} выполнено`}
          icon={ShoppingBag}
        />
        <StatCard
          label="Выручка"
          value={`${fmt(stats.total_revenue)} сом`}
          sub="по выполненным заказам"
          icon={Banknote}
          accent="#4ade80"
        />
        <StatCard
          label="Средний чек"
          value={`${fmt(Math.round(Number(stats.avg_order)))} сом`}
          icon={ArrowUpRight}
          accent="#60a5fa"
        />
        <StatCard
          label="Пользователи"
          value={userStats.total_users}
          sub={`${userStats.active_users} активных · ${userStats.blocked_users} заблок.`}
          icon={Users}
          accent="#a78bfa"
        />
      </div>

      {/* Row 2: Bar chart + Status breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Revenue chart */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              Выручка за 7 дней
            </h2>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>по выполненным заказам</span>
          </div>
          {weekData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-faint)" }}>
              Нет данных за последнюю неделю
            </p>
          ) : (
            <div className="flex items-end gap-3 h-36">
              {weekData.map((d) => {
                const h = maxRevenue > 0 ? Math.max(8, (Number(d.revenue) / maxRevenue) * 136) : 8;
                return (
                  <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>
                      {fmt(d.revenue)}
                    </span>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${h}px`,
                        background: "linear-gradient(180deg,#ffc84a,#f5a623)",
                        minWidth: 28,
                      }}
                    />
                    <span className="text-[10px] font-semibold" style={{ color: "var(--text-faint)" }}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order statuses */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              Статусы заказов
            </h2>
            <div className="flex items-center gap-2 text-xs" style={{ color: completionRate >= 50 ? "#4ade80" : "#f87171" }}>
              <CheckCircle size={12} />
              {completionRate}% выполнено
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {statusBreak.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-faint)" }}>Нет данных</p>
            ) : (
              statusBreak.map((s) => {
                const color = STATUS_COLORS[s.status] ?? "#f5a623";
                const pct = Number(stats.total_orders) > 0
                  ? Math.round((Number(s.cnt) / Number(stats.total_orders)) * 100) : 0;
                return (
                  <div key={s.status} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs flex-1" style={{ color: "var(--text-muted)" }}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                    <span className="text-xs font-bold" style={{ color }}>{s.cnt}</span>
                    <span className="text-[10px] w-8 text-right" style={{ color: "var(--text-faint)" }}>{pct}%</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Top products + Recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Top products */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Топ товаров</h2>
            <Star size={14} style={{ color: "#f5a623" }} />
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "var(--text-faint)" }}>Нет данных</p>
          ) : (
            <div className="flex flex-col gap-4">
              {topProducts.map((p, i) => (
                <div key={p.product_name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                        style={{ background: i === 0 ? "linear-gradient(135deg,#f5a623,#c47d0e)" : "var(--bg-base)", color: i === 0 ? "#000" : "var(--text-faint)" }}
                      >{i + 1}</span>
                      <span className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)", maxWidth: 160 }}>
                        {p.product_name}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold" style={{ color: "#f5a623" }}>{p.qty} шт.</div>
                      <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>{fmt(p.revenue)} сом</div>
                    </div>
                  </div>
                  <MiniBar value={Number(p.qty)} max={maxBar} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Последние заказы</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold transition-colors hover:text-[#f5a623]"
              style={{ color: "var(--text-faint)" }}
            >
              Все →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-faint)" }}>Нет заказов</p>
            ) : (
              recentOrders.map((o) => {
                const color = STATUS_COLORS[o.status] ?? "#f5a623";
                const Icon = o.status === "COMPLETED" ? CheckCircle : o.status === "CANCELLED" ? XCircle : Clock;
                return (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: "var(--bg-base)" }}
                  >
                    <Icon size={14} style={{ color, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                        {o.customer_name ?? "—"} · {o.order_number}
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>{o.created_at}</div>
                    </div>
                    <div className="text-xs font-black flex-shrink-0" style={{ color: "#f5a623" }}>
                      {fmt(o.total_amount)} сом
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
