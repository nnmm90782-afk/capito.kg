import type { ReactNode } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  MessageSquare,
  Coffee,
  ExternalLink,
  CalendarDays,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin",           label: "Аналитика",   icon: LayoutDashboard },
  { href: "/admin/menu",      label: "Меню",         icon: UtensilsCrossed },
  { href: "/admin/orders",    label: "Заказы",       icon: ShoppingBag },
  { href: "/admin/bookings",  label: "Бронирования", icon: CalendarDays },
  { href: "/admin/users",     label: "Пользователи", icon: Users },
  { href: "/admin/reviews",   label: "Отзывы",       icon: MessageSquare },
] as const;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* ── Sidebar ── */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col border-r"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-gold)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)" }}
            >
              <Coffee size={16} color="#000" />
            </div>
            <div>
              <div className="font-black text-sm leading-none" style={{ color: "var(--text-primary)" }}>
                CAPITO
              </div>
              <div className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--gold)" }}>
                ADMIN
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{ color: "var(--text-muted)" }}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer link */}
        <div className="px-3 pb-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ color: "var(--text-faint)", border: "1px solid var(--border-subtle)" }}
          >
            <ExternalLink size={12} />
            На сайт
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
