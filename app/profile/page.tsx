"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Camera,
  Edit3,
  Check,
  X,
  ShoppingBag,
  CalendarDays,
  LogOut,
  ChevronRight,
  Clock,
  Loader2,
  Phone,
  Mail,
  Star,
  Package,
  MapPin,
  Users,
} from "lucide-react";
import { useAuth } from "../auth-provider";
import { useLang } from "../lang-provider";
import { makeT } from "../components/translations";
import { supabase } from "../../lib/supabase";
import {
  getProfileByEmail,
  updateProfile,
  updateAvatarUrl,
  getOrdersByEmail,
  getBookingsByEmail,
  type ProfileData,
  type OrderRow,
  type BookingRow,
} from "./actions";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";

// ─── Status maps ─────────────────────────────────────────────────────────────

const ORDER_STATUS: Record<string, { bg: string; color: string; ru: string; en: string; kg: string }> = {
  NEW:        { bg: "rgba(245,166,35,0.14)",  color: "#f5a623", ru: "Новый",       en: "New",         kg: "Жаңы"         },
  ACCEPTED:   { bg: "rgba(59,130,246,0.14)",  color: "#60a5fa", ru: "Принят",      en: "Accepted",    kg: "Кабыл алынды" },
  PREPARING:  { bg: "rgba(168,85,247,0.14)",  color: "#c084fc", ru: "Готовится",   en: "Preparing",   kg: "Даярдалууда"  },
  READY:      { bg: "rgba(34,197,94,0.14)",   color: "#4ade80", ru: "Готов",       en: "Ready",       kg: "Даяр"         },
  COMPLETED:  { bg: "rgba(34,197,94,0.14)",   color: "#4ade80", ru: "Завершён",    en: "Completed",   kg: "Аяктады"      },
  CANCELLED:  { bg: "rgba(239,68,68,0.14)",   color: "#f87171", ru: "Отменён",     en: "Cancelled",   kg: "Жокко чыкты"  },
  DELIVERED:  { bg: "rgba(34,197,94,0.14)",   color: "#4ade80", ru: "Доставлен",   en: "Delivered",   kg: "Жеткирилди"   },
  IN_TRANSIT: { bg: "rgba(59,130,246,0.14)",  color: "#60a5fa", ru: "В пути",      en: "In transit",  kg: "Жолдо"        },
  PICKED_UP:  { bg: "rgba(245,166,35,0.14)",  color: "#f5a623", ru: "Получен",     en: "Picked up",   kg: "Алынды"       },
};

const BOOKING_STATUS: Record<string, { bg: string; color: string; ru: string; en: string; kg: string }> = {
  PENDING:   { bg: "rgba(245,166,35,0.14)",  color: "#f5a623", ru: "Ожидает",     en: "Pending",     kg: "Күтүүдө"      },
  CONFIRMED: { bg: "rgba(34,197,94,0.14)",   color: "#4ade80", ru: "Подтверждён", en: "Confirmed",   kg: "Тастыкталды"  },
  CANCELLED: { bg: "rgba(239,68,68,0.14)",   color: "#f87171", ru: "Отменён",     en: "Cancelled",   kg: "Жокко чыкты"  },
  COMPLETED: { bg: "rgba(34,197,94,0.14)",   color: "#4ade80", ru: "Завершён",    en: "Completed",   kg: "Аяктады"      },
  NO_SHOW:   { bg: "rgba(239,68,68,0.14)",   color: "#f87171", ru: "Не явился",   en: "No show",     kg: "Келген жок"   },
};

type Lang = "ru" | "en" | "kg";

function StatusBadge({
  status,
  map,
  lang,
}: {
  status: string;
  map: typeof ORDER_STATUS | typeof BOOKING_STATUS;
  lang: string;
}) {
  const s = map[status] ?? { bg: "rgba(245,240,232,0.07)", color: "var(--text-faint)", ru: status, en: status, kg: status };
  const label = (s as Record<string, string>)[lang] ?? s.ru;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {label}
    </span>
  );
}

// ─── Field block ──────────────────────────────────────────────────────────────

function FieldBlock({
  icon,
  label,
  value,
  editing,
  inputValue,
  onChange,
  placeholder,
  readOnly = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  editing: boolean;
  inputValue: string;
  onChange: (v: string) => void;
  placeholder: string;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase" style={{ color: "var(--text-faint)" }}>
        <span style={{ color: "#f5a623", opacity: 0.7 }}>{icon}</span>
        {label}
      </label>
      {editing && !readOnly ? (
        <input
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-gold)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(245,166,35,0.6)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-gold)")}
        />
      ) : (
        <div
          className="w-full px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: "var(--bg-overlay)",
            border: "1px solid var(--border-subtle)",
            color: value ? "var(--text-primary)" : "var(--text-faint)",
          }}
        >
          {value || <span style={{ color: "var(--text-hint)" }}>—</span>}
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      className="rounded-2xl flex flex-col items-center justify-center py-16 gap-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-gold)" }}
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(245,166,35,0.07)", color: "rgba(245,166,35,0.4)" }}>
        {icon}
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text-faint)" }}>{text}</p>
    </div>
  );
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = "profile" | "orders" | "bookings";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const { lang } = useLang();
  const tr = makeT(lang as Lang);

  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Expanded order
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // ── Auth gate ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.email) return;
    setDataLoading(true);
    Promise.all([
      getProfileByEmail(user.email),
      getOrdersByEmail(user.email),
      getBookingsByEmail(user.email),
    ]).then(([p, o, b]) => {
      setProfile(p);
      setOrders(o);
      setBookings(b);
      if (p) {
        setFirstName(p.firstName ?? "");
        setLastName(p.lastName ?? "");
        setPhone(p.phone ?? "");
        setAvatarPreview(p.avatarUrl);
      }
      setDataLoading(false);
    });
  }, [user?.email]);

  // ── Edit handlers ────────────────────────────────────────────────────────────
  function startEdit() {
    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setPhone(profile?.phone ?? "");
    setSaveMsg(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveMsg(null);
  }

  function handleSave() {
    if (!user?.email) return;
    startTransition(async () => {
      const res = await updateProfile(user.email!, { firstName, lastName, phone });
      if (res.ok) {
        setProfile((prev) =>
          prev
            ? { ...prev, firstName: firstName.trim() || null, lastName: lastName.trim() || null, phone: phone.trim() || null }
            : prev
        );
        setSaveMsg({ ok: true, text: tr("profile_saved_ok") });
        setEditing(false);
      } else {
        setSaveMsg({ ok: false, text: tr("profile_saved_err") });
      }
    });
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.email) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;

    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const safeName = user.email.replace(/[^a-zA-Z0-9]/g, "_");
      const path = `${safeName}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      await updateAvatarUrl(user.email, publicUrl);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: publicUrl } : prev));
      setAvatarPreview(publicUrl);
    } catch (err) {
      console.error("Avatar upload error:", err);
      setAvatarPreview(profile?.avatarUrl ?? null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (authLoading || dataLoading) {
    return (
      <>
        <Navbar />
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--bg-base)" }}
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="animate-spin" style={{ color: "#f5a623" }} />
            <span className="text-sm" style={{ color: "var(--text-faint)" }}>Загрузка…</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) return null;

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    user.email?.split("@")[0] ||
    tr("profile_no_name");

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(lang === "en" ? "en-GB" : "ru-RU", {
        month: "long",
        year: "numeric",
      })
    : null;

  // ─── Tab definitions ──────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string; icon: React.ReactNode; count: number | null }[] = [
    { key: "profile",  label: tr("profile_tab_profile"),  icon: <User size={15} />,         count: null          },
    { key: "orders",   label: tr("profile_tab_orders"),   icon: <ShoppingBag size={15} />,  count: orders.length  },
    { key: "bookings", label: tr("profile_tab_bookings"), icon: <CalendarDays size={15} />, count: bookings.length },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16" style={{ background: "var(--bg-base)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* ── Page heading ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p
                className="text-[11px] font-bold tracking-[0.2em] uppercase mb-1"
                style={{ color: "#f5a623" }}
              >
                Capito Coffee
              </p>
              <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
                {tr("profile_title")}
              </h1>
            </div>
            <button
              onClick={handleSignOut}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-[rgba(239,68,68,0.07)]"
              style={{
                border: "1px solid rgba(239,68,68,0.22)",
                color: "#f87171",
              }}
            >
              <LogOut size={14} />
              {tr("nav_logout")}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[288px_1fr] gap-6">

            {/* ── Left sidebar ──────────────────────────────────────────── */}
            <aside className="flex flex-col gap-4">

              {/* Avatar + info card */}
              <div
                className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-gold)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                {/* Avatar ring */}
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                    style={{
                      background: "linear-gradient(145deg,#1c1006,#0a0500)",
                      border: "2.5px solid rgba(245,166,35,0.45)",
                    }}
                  >
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt={displayName}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <User size={34} style={{ color: "#f5a623", opacity: 0.6 }} />
                    )}
                    {uploading && (
                      <div
                        className="absolute inset-0 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.55)" }}
                      >
                        <Loader2 size={20} className="animate-spin" style={{ color: "#f5a623" }} />
                      </div>
                    )}
                  </div>

                  {/* Camera button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg,#f5a623,#ffc84a)",
                      boxShadow: "0 2px 10px rgba(245,166,35,0.45)",
                    }}
                    title={tr("profile_photo_upload")}
                    aria-label={tr("profile_photo_upload")}
                  >
                    <Camera size={13} color="#000" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                {/* Name / email */}
                <div className="w-full">
                  <p className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                    {displayName}
                  </p>
                  <p
                    className="text-xs mt-1 truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {user.email}
                  </p>
                  {memberSince && (
                    <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
                      {tr("profile_member_since")} {memberSince}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div
                  className="w-full grid grid-cols-2 gap-px rounded-xl overflow-hidden"
                  style={{ background: "var(--border-gold)" }}
                >
                  {[
                    { value: orders.length,   label: tr("profile_tab_orders")   },
                    { value: bookings.length, label: tr("profile_tab_bookings") },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center py-3 gap-0.5"
                      style={{ background: "var(--bg-overlay)" }}
                    >
                      <span className="text-xl font-black" style={{ color: "#f5a623" }}>
                        {s.value}
                      </span>
                      <span className="text-[10px] font-medium leading-tight text-center px-1" style={{ color: "var(--text-faint)" }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nav tabs */}
              <nav
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-gold)" }}
              >
                {TABS.map((t, i) => {
                  const active = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-left transition-all duration-150${i < TABS.length - 1 ? " border-b" : ""}`}
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: active ? "rgba(245,166,35,0.07)" : "transparent",
                        color: active ? "#f5a623" : "var(--text-muted)",
                        borderLeft: active ? "3px solid #f5a623" : "3px solid transparent",
                      }}
                    >
                      <span style={{ opacity: active ? 1 : 0.6 }}>{t.icon}</span>
                      <span className="flex-1">{t.label}</span>
                      {t.count !== null && t.count > 0 && (
                        <span
                          className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                          style={{
                            background: active ? "rgba(245,166,35,0.18)" : "rgba(245,240,232,0.05)",
                            color: active ? "#f5a623" : "var(--text-faint)",
                          }}
                        >
                          {t.count}
                        </span>
                      )}
                      <ChevronRight size={13} style={{ opacity: 0.3 }} />
                    </button>
                  );
                })}
              </nav>

              {/* Mobile sign-out */}
              <button
                onClick={handleSignOut}
                className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#f87171",
                }}
              >
                <LogOut size={14} />
                {tr("nav_logout")}
              </button>
            </aside>

            {/* ── Content area ──────────────────────────────────────────── */}
            <div className="min-w-0">

              {/* ════ PROFILE TAB ════ */}
              {tab === "profile" && (
                <div
                  className="rounded-2xl p-6 sm:p-8"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-gold)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                      {tr("profile_tab_profile")}
                    </h2>
                    {!editing ? (
                      <button
                        onClick={startEdit}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                        style={{
                          background: "rgba(245,166,35,0.09)",
                          border: "1px solid rgba(245,166,35,0.28)",
                          color: "#f5a623",
                        }}
                      >
                        <Edit3 size={13} />
                        {tr("profile_edit")}
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-all"
                          style={{ border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
                        >
                          <X size={13} />
                          {tr("profile_cancel")}
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isPending}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 disabled:opacity-60"
                          style={{
                            background: "linear-gradient(135deg,#f5a623,#ffc84a)",
                            color: "#000",
                          }}
                        >
                          {isPending
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Check size={13} />}
                          {tr("profile_save")}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Save feedback toast */}
                  {saveMsg && (
                    <div
                      className="mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
                      style={{
                        background: saveMsg.ok ? "rgba(34,197,94,0.09)" : "rgba(239,68,68,0.09)",
                        border: `1px solid ${saveMsg.ok ? "rgba(34,197,94,0.28)" : "rgba(239,68,68,0.28)"}`,
                        color: saveMsg.ok ? "#4ade80" : "#f87171",
                      }}
                    >
                      {saveMsg.ok ? <Check size={14} /> : <X size={14} />}
                      {saveMsg.text}
                    </div>
                  )}

                  {/* Form grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FieldBlock
                      icon={<User size={13} />}
                      label={tr("profile_first_name")}
                      value={profile?.firstName}
                      editing={editing}
                      inputValue={firstName}
                      onChange={setFirstName}
                      placeholder={tr("profile_first_name")}
                    />
                    <FieldBlock
                      icon={<Star size={13} />}
                      label={tr("profile_last_name")}
                      value={profile?.lastName}
                      editing={editing}
                      inputValue={lastName}
                      onChange={setLastName}
                      placeholder={tr("profile_last_name")}
                    />
                    <FieldBlock
                      icon={<Mail size={13} />}
                      label={tr("profile_email")}
                      value={user.email}
                      editing={false}
                      inputValue={user.email ?? ""}
                      onChange={() => {}}
                      placeholder=""
                      readOnly
                    />
                    <FieldBlock
                      icon={<Phone size={13} />}
                      label={tr("profile_phone")}
                      value={profile?.phone}
                      editing={editing}
                      inputValue={phone}
                      onChange={setPhone}
                      placeholder="+996 XXX XXX XXX"
                    />
                  </div>

                  {/* Avatar hint strip */}
                  <div
                    className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: "rgba(245,166,35,0.04)",
                      border: "1px dashed rgba(245,166,35,0.2)",
                    }}
                  >
                    <Camera size={15} style={{ color: "#f5a623", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: "#f5a623" }}>
                        {tr("profile_photo")}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                        {uploading ? tr("profile_uploading") : "JPG, PNG, WEBP · max 5 MB"}
                      </p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50 whitespace-nowrap"
                      style={{
                        background: "rgba(245,166,35,0.10)",
                        border: "1px solid rgba(245,166,35,0.24)",
                        color: "#f5a623",
                      }}
                    >
                      {uploading
                        ? <Loader2 size={11} className="animate-spin" />
                        : <Camera size={11} />}
                      {tr("profile_photo_change")}
                    </button>
                  </div>
                </div>
              )}

              {/* ════ ORDERS TAB ════ */}
              {tab === "orders" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                      {tr("profile_tab_orders")}
                    </h2>
                    {orders.length > 0 && (
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                        {orders.length} {lang === "ru" ? "шт." : lang === "kg" ? "дана" : "total"}
                      </span>
                    )}
                  </div>

                  {orders.length === 0 ? (
                    <EmptyState icon={<ShoppingBag size={38} />} text={tr("profile_orders_empty")} />
                  ) : (
                    orders.map((order) => {
                      const isExpanded = expandedOrder === order.id;
                      return (
                        <div
                          key={order.id}
                          className="rounded-2xl overflow-hidden"
                          style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-gold)",
                            boxShadow: "var(--shadow-card)",
                          }}
                        >
                          {/* Summary row — click to expand */}
                          <button
                            className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[rgba(245,166,35,0.025)]"
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                background: "rgba(245,166,35,0.09)",
                                border: "1px solid rgba(245,166,35,0.2)",
                              }}
                            >
                              <Package size={17} style={{ color: "#f5a623" }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                  #{order.orderNumber}
                                </span>
                                <StatusBadge status={order.status} map={ORDER_STATUS} lang={lang} />
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-faint)" }}>
                                  <Clock size={10} />
                                  {new Date(order.createdAt).toLocaleDateString(
                                    lang === "en" ? "en-GB" : "ru-RU",
                                    { day: "numeric", month: "short", year: "numeric" }
                                  )}
                                </span>
                                {order.itemCount > 0 && (
                                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                                    {order.itemCount} {tr("profile_items")}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-base font-black" style={{ color: "#f5a623" }}>
                                {order.totalAmount.toLocaleString()} {tr("currency")}
                              </span>
                              <ChevronRight
                                size={15}
                                style={{
                                  color: "var(--text-faint)",
                                  transform: isExpanded ? "rotate(90deg)" : "none",
                                  transition: "transform 0.2s",
                                }}
                              />
                            </div>
                          </button>

                          {/* Expanded items list */}
                          {isExpanded && (
                            <div
                              className="px-5 pb-5 border-t"
                              style={{ borderColor: "var(--border-subtle)" }}
                            >
                              <div className="pt-4 flex flex-col gap-2.5">
                                {order.items.length === 0 ? (
                                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>—</p>
                                ) : (
                                  order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-baseline justify-between gap-4">
                                      <span className="text-sm leading-snug" style={{ color: "var(--text-muted)" }}>
                                        {item.name}
                                        {item.quantity > 1 && (
                                          <span className="ml-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
                                            × {item.quantity}
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-sm font-semibold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                                        {(item.unitPrice * item.quantity).toLocaleString()} {tr("currency")}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Total divider */}
                              <div
                                className="mt-4 pt-3 flex items-center justify-between border-t"
                                style={{ borderColor: "var(--border-subtle)" }}
                              >
                                <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--text-faint)" }}>
                                  {tr("profile_total")}
                                </span>
                                <span className="text-base font-black" style={{ color: "#f5a623" }}>
                                  {order.totalAmount.toLocaleString()} {tr("currency")}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ════ BOOKINGS TAB ════ */}
              {tab === "bookings" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                      {tr("profile_tab_bookings")}
                    </h2>
                    {bookings.length > 0 && (
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                        {bookings.length} {lang === "ru" ? "шт." : lang === "kg" ? "дана" : "total"}
                      </span>
                    )}
                  </div>

                  {bookings.length === 0 ? (
                    <EmptyState icon={<CalendarDays size={38} />} text={tr("profile_bookings_empty")} />
                  ) : (
                    bookings.map((b) => (
                      <div
                        key={b.id}
                        className="rounded-2xl p-5"
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-gold)",
                          boxShadow: "var(--shadow-card)",
                        }}
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                background: "rgba(245,166,35,0.09)",
                                border: "1px solid rgba(245,166,35,0.2)",
                              }}
                            >
                              <CalendarDays size={17} style={{ color: "#f5a623" }} />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                  {tr("profile_booking_num")} #{b.bookingNumber}
                                </span>
                                <StatusBadge status={b.status} map={BOOKING_STATUS} lang={lang} />
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                                {new Date(b.createdAt).toLocaleDateString(
                                  lang === "en" ? "en-GB" : "ru-RU",
                                  { day: "numeric", month: "short", year: "numeric" }
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {/* Date */}
                          <div
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                          >
                            <CalendarDays size={13} style={{ color: "#f5a623", flexShrink: 0 }} />
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                                {lang === "ru" ? "Дата" : lang === "kg" ? "Дата" : "Date"}
                              </p>
                              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                {new Date(b.date + "T00:00:00").toLocaleDateString(
                                  lang === "en" ? "en-GB" : "ru-RU",
                                  { day: "numeric", month: "short" }
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Time */}
                          <div
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                          >
                            <Clock size={13} style={{ color: "#f5a623", flexShrink: 0 }} />
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                                {lang === "ru" ? "Время" : lang === "kg" ? "Убакыт" : "Time"}
                              </p>
                              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                {b.startTime}
                              </p>
                            </div>
                          </div>

                          {/* Guests */}
                          <div
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                          >
                            <Users size={13} style={{ color: "#f5a623", flexShrink: 0 }} />
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                                {tr("profile_guests")}
                              </p>
                              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                {b.guestCount}
                              </p>
                            </div>
                          </div>

                          {/* Branch */}
                          {b.branchName && (
                            <div
                              className="col-span-2 sm:col-span-3 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                            >
                              <MapPin size={13} style={{ color: "#f5a623", flexShrink: 0 }} />
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                                  {lang === "ru" ? "Филиал" : lang === "kg" ? "Филиал" : "Branch"}
                                </p>
                                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                  {b.branchName}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Comment */}
                          {b.comment && (
                            <div
                              className="col-span-2 sm:col-span-3 px-3 py-2.5 rounded-xl"
                              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-faint)" }}>
                                {lang === "ru" ? "Комментарий" : lang === "kg" ? "Комментарий" : "Note"}
                              </p>
                              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{b.comment}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
