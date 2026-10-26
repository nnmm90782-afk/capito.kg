"use client";

import { useState, useTransition } from "react";
import { PageShell } from "../components/page-shell";
import { createBooking } from "../admin/actions";
import {
  CalendarDays, Clock, Users, MapPin, MessageSquare,
  User, Mail, Phone, CheckCircle, ChevronDown,
  ArrowRight, Coffee, Sparkles,
} from "lucide-react";

export interface Branch { id: string; name: string; address: string }

const ACCENT = "#f5a623";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00",
];

const DURATIONS = [
  { value: "1", label: "1 час" },
  { value: "1.5", label: "1.5 часа" },
  { value: "2", label: "2 часа" },
  { value: "2.5", label: "2.5 часа" },
  { value: "3", label: "3 часа" },
];

function addTime(start: string, hoursStr: string): string {
  const [h, m] = start.split(":").map(Number);
  const hours = parseFloat(hoursStr);
  const totalMin = h * 60 + m + Math.round(hours * 60);
  const eh = Math.floor(totalMin / 60) % 24;
  const em = totalMin % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

// Today in YYYY-MM-DD, min date for the picker
function todayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// Step indicator
function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all"
        style={{
          background: done
            ? "linear-gradient(135deg,#4ade80,#22c55e)"
            : active
            ? "linear-gradient(135deg,#f5a623,#c47d0e)"
            : "var(--bg-base)",
          color: done || active ? "#000" : "var(--text-faint)",
          border: done || active ? "none" : "1px solid var(--border-subtle)",
        }}
      >
        {done ? "✓" : n}
      </div>
      <span
        className="text-xs font-semibold hidden sm:block"
        style={{ color: active ? "var(--text-primary)" : done ? "#4ade80" : "var(--text-faint)" }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingClient({ branches }: { branches: Branch[] }) {
  const [step, setStep] = useState(1); // 1 = details, 2 = contacts, 3 = confirm, 4 = success

  // Step 1 — reservation details
  const [branchId,   setBranchId]   = useState(branches[0]?.id ?? "");
  const [date,       setDate]       = useState("");
  const [startTime,  setStartTime]  = useState("19:00");
  const [duration,   setDuration]   = useState("1.5");
  const [guestCount, setGuestCount] = useState(2);
  const [comment,    setComment]    = useState("");

  // Step 2 — contact info
  const [userName,  setUserName]  = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");

  // Result
  const [bookingNum, setBookingNum] = useState("");
  const [error,      setError]     = useState("");
  const [pending,    startTransition] = useTransition();

  const endTime = startTime ? addTime(startTime, duration) : "";
  const branch  = branches.find(b => b.id === branchId);

  // Validation
  const step1Valid = !!branchId && !!date && !!startTime && guestCount >= 1;
  const step2Valid = !!userName.trim() && !!userEmail.trim();

  function handleSubmit() {
    setError("");
    const fd = new FormData();
    fd.set("branchId",   branchId);
    fd.set("date",       date);
    fd.set("startTime",  startTime);
    fd.set("endTime",    endTime);
    fd.set("guestCount", String(guestCount));
    fd.set("comment",    comment);
    fd.set("userName",   userName);
    fd.set("userEmail",  userEmail);
    fd.set("userPhone",  userPhone);

    startTransition(async () => {
      const res = await createBooking(fd);
      if (res.ok && res.booking_number) {
        setBookingNum(res.booking_number);
        setStep(4);
      } else {
        setError(res.error ?? "Произошла ошибка. Попробуйте ещё раз.");
      }
    });
  }

  return (
    <PageShell>
      {/* ── Hero ── */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--hero-radial)" }} />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="divider-gold" />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: ACCENT }}>
              Бронирование столика
            </span>
          </div>
          <h1 className="text-5xl font-black leading-none mb-4" style={{ color: "var(--text-primary)" }}>
            Забронируйте{" "}
            <span className="text-gold-gradient">столик</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Выберите удобный филиал, дату и время. Мы подтвердим бронирование и будем ждать вас.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="py-14" style={{ background: "var(--bg-surface)" }}>
        <div className="max-w-3xl mx-auto px-6">

          {step < 4 && (
            <>
              {/* Progress bar */}
              <div
                className="rounded-2xl border p-5 mb-8 flex items-center gap-4"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
              >
                <Step n={1} label="Детали"   active={step === 1} done={step > 1} />
                <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                <Step n={2} label="Контакты" active={step === 2} done={step > 2} />
                <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                <Step n={3} label="Проверка" active={step === 3} done={step > 3} />
              </div>
            </>
          )}

          {/* ── STEP 1: Details ── */}
          {step === 1 && (
            <div
              className="rounded-2xl border p-7 space-y-6"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
            >
              <h2 className="text-xl font-black flex items-center gap-2.5" style={{ color: "var(--text-primary)" }}>
                <CalendarDays size={20} style={{ color: ACCENT }} />
                Выберите дату и время
              </h2>

              {/* Branch */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                  <MapPin size={12} className="inline mr-1.5" style={{ color: ACCENT }} />
                  Филиал <span style={{ color: ACCENT }}>*</span>
                </label>
                <div className="relative">
                  <select
                    value={branchId}
                    onChange={e => setBranchId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm appearance-none outline-none pr-10"
                    style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} — {b.address}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                </div>
              </div>

              {/* Date + Guest count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                    <CalendarDays size={12} className="inline mr-1.5" style={{ color: ACCENT }} />
                    Дата <span style={{ color: ACCENT }}>*</span>
                  </label>
                  <input
                    type="date"
                    min={todayStr()}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="px-4 py-3 rounded-xl border text-sm outline-none"
                    style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                    <Users size={12} className="inline mr-1.5" style={{ color: ACCENT }} />
                    Кол-во гостей <span style={{ color: ACCENT }}>*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGuestCount(g => Math.max(1, g - 1))}
                      className="w-10 h-10 rounded-full border text-lg font-bold flex items-center justify-center transition-all hover:border-[#f5a623] hover:text-[#f5a623] flex-shrink-0"
                      style={{ borderColor: "var(--border-gold)", color: "var(--text-muted)" }}
                    >−</button>
                    <div className="flex-1 text-center font-black text-xl" style={{ color: "var(--text-primary)" }}>
                      {guestCount}
                    </div>
                    <button
                      type="button"
                      onClick={() => setGuestCount(g => Math.min(20, g + 1))}
                      className="w-10 h-10 rounded-full border text-lg font-bold flex items-center justify-center transition-all hover:border-[#f5a623] hover:text-[#f5a623] flex-shrink-0"
                      style={{ borderColor: "var(--border-gold)", color: "var(--text-muted)" }}
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Time slots */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                  <Clock size={12} className="inline mr-1.5" style={{ color: ACCENT }} />
                  Время начала <span style={{ color: ACCENT }}>*</span>
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setStartTime(slot)}
                      className="py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.04]"
                      style={startTime === slot
                        ? { background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }
                        : { background: "var(--bg-base)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }
                      }
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                  <Clock size={12} className="inline mr-1.5" style={{ color: "var(--text-faint)" }} />
                  Длительность
                </label>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDuration(d.value)}
                      className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                      style={duration === d.value
                        ? { background: "rgba(245,166,35,0.15)", color: ACCENT, border: `1px solid ${ACCENT}` }
                        : { background: "var(--bg-base)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }
                      }
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                {startTime && endTime && (
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                    Время: {startTime} — {endTime}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                  <MessageSquare size={12} className="inline mr-1.5" style={{ color: "var(--text-faint)" }} />
                  Комментарий
                </label>
                <textarea
                  rows={3}
                  placeholder="Особые пожелания: столик у окна, высокий стул для ребёнка..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
              >
                Далее — контактные данные
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── STEP 2: Contacts ── */}
          {step === 2 && (
            <div
              className="rounded-2xl border p-7 space-y-6"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
            >
              <h2 className="text-xl font-black flex items-center gap-2.5" style={{ color: "var(--text-primary)" }}>
                <User size={20} style={{ color: ACCENT }} />
                Ваши контакты
              </h2>

              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                  <User size={12} className="inline mr-1.5" style={{ color: ACCENT }} />
                  Имя и фамилия <span style={{ color: ACCENT }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Асан Сыдыков"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                  <Mail size={12} className="inline mr-1.5" style={{ color: ACCENT }} />
                  Email <span style={{ color: ACCENT }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="example@mail.com"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  className="px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }}
                />
                <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                  Мы отправим подтверждение на этот адрес
                </p>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                  <Phone size={12} className="inline mr-1.5" style={{ color: "var(--text-faint)" }} />
                  Телефон
                </label>
                <input
                  type="tel"
                  placeholder="+996 700 000 000"
                  value={userPhone}
                  onChange={e => setUserPhone(e.target.value)}
                  className="px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-2xl font-bold text-sm border transition-all"
                  style={{ borderColor: "var(--border-gold)", color: "var(--text-muted)" }}
                >
                  ← Назад
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!step2Valid}
                  className="flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:scale-[1.01]"
                  style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
                >
                  Проверить бронь
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirmation ── */}
          {step === 3 && (
            <div
              className="rounded-2xl border p-7 space-y-6"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
            >
              <h2 className="text-xl font-black flex items-center gap-2.5" style={{ color: "var(--text-primary)" }}>
                <Sparkles size={20} style={{ color: ACCENT }} />
                Проверьте данные
              </h2>

              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: MapPin,      label: "Филиал",       value: branch ? `${branch.name}` : "—" },
                  { icon: CalendarDays,label: "Дата",         value: date ? new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                  { icon: Clock,       label: "Время",        value: `${startTime} — ${endTime}` },
                  { icon: Users,       label: "Гостей",       value: `${guestCount} ${guestCount === 1 ? "гость" : guestCount < 5 ? "гостя" : "гостей"}` },
                  { icon: User,        label: "Имя",          value: userName },
                  { icon: Mail,        label: "Email",        value: userEmail },
                  ...(userPhone ? [{ icon: Phone, label: "Телефон", value: userPhone }] : []),
                  ...(comment  ? [{ icon: MessageSquare, label: "Комментарий", value: comment }] : []),
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ background: "var(--bg-base)", border: "1px solid var(--border-subtle)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(245,166,35,0.1)" }}
                    >
                      <Icon size={14} style={{ color: ACCENT }} />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>{label}</div>
                      <div className="text-sm font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div
                  className="p-4 rounded-xl text-sm font-semibold"
                  style={{ background: "#f8717118", color: "#f87171", border: "1px solid #f8717130" }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-4 rounded-2xl font-bold text-sm border transition-all"
                  style={{ borderColor: "var(--border-gold)", color: "var(--text-muted)" }}
                >
                  ← Назад
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={pending}
                  className="flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01]"
                  style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
                >
                  {pending ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Подтвердить бронирование
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 4 && (
            <div
              className="rounded-2xl border p-10 text-center space-y-6"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", boxShadow: "var(--shadow-glow)" }}
            >
              {/* Animated check */}
              <div className="flex justify-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", boxShadow: "0 0 32px rgba(74,222,128,0.35)" }}
                >
                  <CheckCircle size={36} color="#000" strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-black mb-2" style={{ color: "var(--text-primary)" }}>
                  Бронь принята!
                </h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Ваш столик забронирован. Мы подтвердим бронирование в ближайшее время.
                </p>
              </div>

              {/* Booking number */}
              <div
                className="inline-block px-8 py-4 rounded-2xl"
                style={{ background: "var(--bg-base)", border: "2px solid rgba(245,166,35,0.4)" }}
              >
                <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>
                  Номер бронирования
                </div>
                <div className="text-2xl font-black" style={{ color: ACCENT }}>
                  {bookingNum}
                </div>
              </div>

              {/* Summary */}
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm"
              >
                {[
                  { icon: MapPin,       value: branch?.name ?? "—" },
                  { icon: CalendarDays, value: date ? new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "—" },
                  { icon: Clock,        value: `${startTime} — ${endTime}` },
                  { icon: Users,        value: `${guestCount} гост${guestCount === 1 ? "ь" : "ей"}` },
                ].map(({ icon: Icon, value }) => (
                  <div
                    key={value}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl"
                    style={{ background: "var(--bg-base)", border: "1px solid var(--border-subtle)" }}
                  >
                    <Icon size={16} style={{ color: ACCENT }} />
                    <span className="text-xs font-semibold text-center" style={{ color: "var(--text-muted)" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Info badge */}
              <div
                className="flex items-start gap-3 p-4 rounded-xl text-left"
                style={{ background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.2)" }}
              >
                <Coffee size={18} style={{ color: ACCENT, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="text-xs font-bold mb-0.5" style={{ color: ACCENT }}>Что дальше?</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Наш администратор свяжется с вами по email{userPhone ? " или телефону" : ""} для подтверждения.
                    Пожалуйста, будьте на связи.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1); setDate(""); setComment(""); setBookingNum(""); setError("");
                  }}
                  className="px-6 py-3 rounded-2xl text-sm font-bold border transition-all hover:scale-[1.02]"
                  style={{ borderColor: "var(--border-gold)", color: "var(--text-muted)" }}
                >
                  Забронировать ещё
                </button>
                <a
                  href="/"
                  className="px-6 py-3 rounded-2xl text-sm font-black text-center transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
                >
                  На главную
                </a>
              </div>
            </div>
          )}

          {/* ── Perks strip ── */}
          {step < 4 && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Coffee, title: "Бесплатная бронь", desc: "Без предоплаты, отмена в любой момент" },
                { icon: Clock,  title: "Быстрое подтверждение", desc: "Ответим в течение 30 минут" },
                { icon: Users,  title: "До 20 гостей",     desc: "Для компаний и корпоративов" },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border p-4 flex items-start gap-3"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(245,166,35,0.1)" }}
                  >
                    <Icon size={16} style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>
    </PageShell>
  );
}
