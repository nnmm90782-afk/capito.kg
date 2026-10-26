import { query } from "@/lib/db";
import { updateOrderStatus } from "@/app/admin/actions";
import {
  ShoppingBag, CheckCircle, Clock, XCircle, Package,
  Truck, ChefHat, User,
} from "lucide-react";

// Admin page: live data from DB, rendered on demand.
export const instant = false;

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  user_email: string | null;
  status: string;
  payment_status: string;
  type: string;
  total_amount: string;
  discount_amount: string;
  delivery_fee: string;
  subtotal: string;
  comment: string | null;
  branch_name: string | null;
  created_at: string;
  completed_at: string | null;
}

interface ItemRow {
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

async function getOrders(): Promise<OrderRow[]> {
  return query<OrderRow>(`
    SELECT
      o.id, o.order_number, o.customer_name, o.customer_phone,
      u.email AS user_email,
      o.status, o.payment_status, o.type,
      o.total_amount::text, o.discount_amount::text,
      o.delivery_fee::text, o.subtotal::text,
      o.comment,
      b.name AS branch_name,
      TO_CHAR(o.created_at, 'DD.MM.YYYY HH24:MI') AS created_at,
      TO_CHAR(o.completed_at, 'DD.MM.YYYY HH24:MI') AS completed_at
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN branches b ON b.id = o.branch_id
    ORDER BY o.created_at DESC
    LIMIT 200
  `);
}

async function getOrderItems(): Promise<ItemRow[]> {
  return query<ItemRow>(`
    SELECT order_id, product_name, quantity,
           unit_price::text, total_price::text
    FROM order_items
  `);
}

// ─────────────────────────────────────────────────────────────────────────────

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

const TYPE_LABELS: Record<string, string> = {
  DELIVERY: "Доставка", PICKUP: "Самовывоз", DINE_IN: "В зале",
};

const NEXT_STATUSES: Record<string, string[]> = {
  NEW: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["DELIVERED", "COMPLETED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const STATUS_ICON: Record<string, React.ElementType> = {
  NEW: Clock, ACCEPTED: Package, PREPARING: ChefHat,
  READY: Package, DELIVERED: Truck, COMPLETED: CheckCircle,
  CANCELLED: XCircle, IN_TRANSIT: Truck,
};

function fmt(n: string | number) {
  return Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 0 });
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function AdminOrdersPage() {
  const [orders, allItems] = await Promise.all([getOrders(), getOrderItems()]);

  const itemsByOrder = allItems.reduce<Record<string, ItemRow[]>>((acc, item) => {
    if (!acc[item.order_id]) acc[item.order_id] = [];
    acc[item.order_id].push(item);
    return acc;
  }, {});

  const totalRevenue = orders
    .filter((o) => o.payment_status === "PAID")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;
  const activeCount = orders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status)).length;

  return (
    <div className="p-8 space-y-6" style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>Заказы</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
          История и управление заказами
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Всего", value: orders.length, color: "#f5a623", icon: ShoppingBag },
          { label: "Выполнено", value: completedCount, color: "#4ade80", icon: CheckCircle },
          { label: "В работе", value: activeCount, color: "#60a5fa", icon: Clock },
          { label: "Выручка", value: `${fmt(totalRevenue)} сом`, color: "#a78bfa", icon: ShoppingBag },
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

      {/* Orders list */}
      <div className="flex flex-col gap-3">
        {orders.length === 0 && (
          <div
            className="rounded-2xl border p-10 text-center text-sm"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", color: "var(--text-faint)" }}
          >
            Заказов нет
          </div>
        )}
        {orders.map((order) => {
          const Icon = STATUS_ICON[order.status] ?? Clock;
          const statusColor = STATUS_COLORS[order.status] ?? "#f5a623";
          const items = itemsByOrder[order.id] ?? [];
          const nextStatuses = NEXT_STATUSES[order.status] ?? [];

          return (
            <div
              key={order.id}
              className="rounded-2xl border overflow-hidden"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
            >
              {/* Header row */}
              <div className="px-5 py-4 flex flex-wrap items-center gap-3">
                <Icon size={16} style={{ color: statusColor, flexShrink: 0 }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm" style={{ color: "var(--text-primary)" }}>
                      {order.order_number}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${statusColor}18`, color: statusColor }}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--bg-base)", color: "var(--text-faint)" }}>
                      {TYPE_LABELS[order.type] ?? order.type}
                    </span>
                    {order.payment_status === "PAID" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#4ade8018", color: "#4ade80" }}>
                        Оплачено
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
                      <User size={10} />
                      {order.customer_name ?? order.user_email ?? "Гость"}
                    </span>
                    {order.customer_phone && (
                      <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{order.customer_phone}</span>
                    )}
                    {order.branch_name && (
                      <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{order.branch_name}</span>
                    )}
                    <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{order.created_at}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-black" style={{ color: "#f5a623" }}>
                    {fmt(order.total_amount)} сом
                  </div>
                  {Number(order.discount_amount) > 0 && (
                    <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                      Скидка: {fmt(order.discount_amount)} сом
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              {items.length > 0 && (
                <div className="px-5 pb-3 border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex flex-col gap-1.5">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span style={{ color: "var(--text-muted)" }}>
                          {item.product_name}
                          <span className="ml-1" style={{ color: "var(--text-faint)" }}>×{item.quantity}</span>
                        </span>
                        <span style={{ color: "var(--text-faint)" }}>{fmt(item.total_price)} сом</span>
                      </div>
                    ))}
                    {order.comment && (
                      <div className="text-[11px] mt-1 italic" style={{ color: "var(--text-faint)" }}>
                        Комментарий: {order.comment}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status actions */}
              {nextStatuses.length > 0 && (
                <div
                  className="px-5 py-3 flex items-center gap-2 flex-wrap border-t"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--bg-base)" }}
                >
                  <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>Изменить статус:</span>
                  {nextStatuses.map((ns) => (
                    <form key={ns} action={updateOrderStatus}>
                      <input type="hidden" name="id" value={order.id} />
                      <input type="hidden" name="status" value={ns} />
                      <button
                        type="submit"
                        className="text-[11px] font-bold px-3 py-1 rounded-full border transition-all hover:scale-[1.03]"
                        style={{
                          borderColor: STATUS_COLORS[ns] ?? "var(--border-gold)",
                          color: STATUS_COLORS[ns] ?? "#f5a623",
                          background: `${STATUS_COLORS[ns] ?? "#f5a623"}10`,
                        }}
                      >
                        → {STATUS_LABELS[ns] ?? ns}
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
