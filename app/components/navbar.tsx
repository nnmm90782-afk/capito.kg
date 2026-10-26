"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Menu, X, Sun, Moon, LogOut, ChevronDown, ShoppingCart, LayoutDashboard } from "lucide-react";
import { useTheme } from "../theme-provider";
import { useLang } from "../lang-provider";
import { useAuth } from "../auth-provider";
import { useCart } from "../cart-provider";
import { CapitoLogo } from "./logo";
import { LangSwitcher } from "./lang-switcher";
import { makeT } from "./translations";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
      className="w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-110"
      style={{ borderColor: "var(--border-gold)", background: "var(--bg-card)", color: "#f5a623" }}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

/** Dropdown shown when the user is logged in */
function UserMenu({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tr = makeT(useLang().lang);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const short = email.length > 20 ? email.slice(0, 18) + "…" : email;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-200 hover:bg-[rgba(245,166,35,0.08)]"
        style={{ borderColor: "rgba(245,166,35,0.4)", color: "#f5a623" }}
      >
        <User size={14} />
        <span className="hidden sm:inline">{short}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 rounded-xl py-1 z-50"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-gold)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border-gold)" }}>
            <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text-muted)" }}>{email}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[rgba(245,166,35,0.06)]"
            style={{ color: "#f5a623" }}
          >
            <LayoutDashboard size={14} />
            {tr("nav_profile")}
          </Link>
          <button
            onClick={() => { setOpen(false); onSignOut(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[rgba(245,166,35,0.06)] border-t"
            style={{ color: "var(--text-muted)", borderColor: "var(--border-subtle)" }}
          >
            <LogOut size={14} />
            {tr("nav_logout")}
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLang();
  const tr = makeT(lang);
  const { user, loading: authLoading, signOut } = useAuth();
  const { count } = useCart();

  const NAV_LINKS = [
    { label: tr("nav_home"),     href: "/"         },
    { label: tr("nav_menu"),     href: "/menu"     },
    { label: tr("nav_booking"),  href: "/booking"  },
    { label: tr("nav_about"),    href: "/about"    },
    { label: tr("nav_branches"), href: "/branches" },
    { label: tr("nav_reviews"),  href: "/reviews"  },
    { label: tr("nav_contacts"), href: "/contacts" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={
        scrolled
          ? {
              background: "var(--navbar-bg)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderBottom: "1px solid var(--border-gold)",
              boxShadow: "var(--shadow-nav)",
            }
          : { background: "transparent" }
      }
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <CapitoLogo size={48} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium tracking-wide transition-colors relative group"
                style={{ color: isActive ? "#f5a623" : "var(--text-muted)" }}
              >
                {link.label}
                <span
                  className="absolute -bottom-1 left-0 right-0 h-px rounded-full transition-all duration-300"
                  style={{
                    background: "linear-gradient(90deg, #f5a623, #ffc84a)",
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "scaleX(1)" : "scaleX(0)",
                  }}
                />
                <span
                  className="absolute -bottom-1 left-0 right-0 h-px rounded-full opacity-0 group-hover:opacity-60 transition-all duration-200"
                  style={{ background: "linear-gradient(90deg, #f5a623, #ffc84a)" }}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-2">
          <LangSwitcher />
          <ThemeToggle />

          {/* Cart */}
          <Link
            href="/cart"
            className="relative w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ borderColor: "var(--border-gold)", background: "var(--bg-card)", color: "#f5a623" }}
            aria-label={tr("nav_cart")}
          >
            <ShoppingCart size={15} />
            {count > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#f5a623,#ffc84a)", color: "#000" }}
              >
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          {!authLoading && (
            user ? (
              <UserMenu email={user.email ?? ""} onSignOut={handleSignOut} />
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#f5a623] text-[#f5a623] text-sm font-semibold hover:bg-[#f5a623] hover:text-black transition-all duration-200"
              >
                <User size={14} />
                {tr("nav_auth")}
              </Link>
            )
          )}
        </div>

        {/* Mobile row */}
        <div className="md:hidden flex items-center gap-2">
          <LangSwitcher />
          <ThemeToggle />
          {/* Mobile cart */}
          <Link
            href="/cart"
            className="relative w-9 h-9 rounded-full border flex items-center justify-center"
            style={{ borderColor: "var(--border-gold)", background: "var(--bg-card)", color: "#f5a623" }}
            aria-label={tr("nav_cart")}
          >
            <ShoppingCart size={15} />
            {count > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#f5a623,#ffc84a)", color: "#000" }}
              >
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
          <button
            className="p-1 transition-colors"
            style={{ color: "var(--text-primary)" }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Open menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-6 py-6 flex flex-col gap-4 border-t"
          style={{
            background: "var(--navbar-bg)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderColor: "var(--border-gold)",
          }}
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-base font-medium transition-colors py-1"
                style={{ color: isActive ? "#f5a623" : "var(--text-muted)" }}
              >
                {link.label}
              </Link>
            );
          })}

          {!authLoading && (
            user ? (
              <div className="flex flex-col gap-2 mt-2">
                <p className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{user.email}</p>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold w-fit"
                  style={{ borderColor: "rgba(245,166,35,0.4)", color: "#f5a623" }}
                >
                  <LogOut size={14} />
                  {tr("nav_logout")}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#f5a623] text-[#f5a623] text-sm font-semibold w-fit mt-2"
              >
                <User size={14} />
                {tr("nav_auth")}
              </Link>
            )
          )}
        </div>
      )}
    </header>
  );
}
