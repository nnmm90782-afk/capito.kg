"use client";

import { Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";
import { PageShell } from "../components/page-shell";
import { useLang } from "../lang-provider";
import { makeT } from "../components/translations";

function IconInstagram({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconFacebook({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export default function ContactsPage() {
  const { lang } = useLang();
  const tr = makeT(lang);

  const CONTACT_CARDS = [
    { icon: Phone,  titleKey: "contacts_phone_h",  value: "0553 603 000",      hintKey: "contacts_phone_hint", href: "tel:+996553603000" },
    { icon: Mail,   titleKey: "contacts_email_lbl", value: "capito.kg@gmail.com", hintKey: "contacts_email_hint", href: "mailto:capito.kg@gmail.com" },
    { icon: MapPin, titleKey: "contacts_office_h",  value: "Байтик Баатыра, 1/4", hintKey: "contacts_office_hint", href: "#" },
  ] as const;

  const SOCIALS = [
    { Icon: IconInstagram, label: "Instagram", handle: "@capito.coffee", href: "#" },
    { Icon: IconFacebook,  label: "Facebook",  handle: "Capito Coffee",  href: "#" },
  ];

  const hours = [
    { day: tr("contacts_mon_fri"), time: "08:00 — 23:00",         special: false },
    { day: tr("contacts_sat"),     time: "09:00 — 23:00",         special: false },
    { day: tr("contacts_sun"),     time: "10:00 — 22:00",         special: false },
    { day: "Чуй 92",               time: tr("contacts_247"),       special: true  },
  ];

  return (
    <PageShell>
      {/* Hero */}
      <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg-base)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--hero-radial)" }} />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="divider-gold" />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>{tr("contacts_label")}</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black leading-none mb-4" style={{ color: "var(--text-primary)" }}>
            {tr("contacts_h1_1")}<br /><span className="text-gold-gradient">{tr("contacts_h1_2")}</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {tr("contacts_desc")}
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="py-16" style={{ background: "var(--bg-surface)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONTACT_CARDS.map((c) => (
              <a key={c.titleKey} href={c.href} className="card-hover card-depth rounded-2xl border p-7 flex flex-col gap-4 group"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)" }}>
                  <c.icon size={22} className="text-black" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>{tr(c.titleKey)}</div>
                  <div className="font-bold text-base group-hover:text-[#f5a623] transition-colors" style={{ color: "var(--text-primary)" }}>{c.value}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{tr(c.hintKey)}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Socials */}
      <section className="py-24" style={{ background: "var(--bg-base)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-14">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="divider-gold" />
                <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>{tr("contacts_write")}</span>
              </div>
              <h2 className="text-3xl font-black mb-8" style={{ color: "var(--text-primary)" }}>
                {tr("contacts_msg_h2")} <span className="text-gold-gradient">{tr("contacts_msg_gold")}</span>
              </h2>
              <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { label: tr("contacts_name"),     placeholder: tr("contacts_name_ph"), type: "text" },
                    { label: tr("contacts_phone_lbl"),placeholder: "+996 ...",              type: "tel"  },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder}
                        className="px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                        style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }} />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{tr("contacts_email_lbl")}</label>
                  <input type="email" placeholder="email@example.com"
                    className="px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{tr("contacts_msg_lbl")}</label>
                  <textarea rows={5} placeholder={tr("contacts_msg_ph")}
                    className="px-4 py-3 rounded-xl border text-sm outline-none transition-all resize-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }} />
                </div>
                <button type="submit" className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm w-fit transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000", boxShadow: "0 8px 24px rgba(245,166,35,0.25)" }}>
                  {tr("contacts_send")} <ArrowRight size={16} />
                </button>
              </form>
            </div>

            {/* Socials + Hours */}
            <div className="lg:col-span-2 flex flex-col gap-10">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="divider-gold" />
                  <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>{tr("contacts_social")}</span>
                </div>
                <div className="flex flex-col gap-4">
                  {SOCIALS.map(({ Icon, label, handle, href }) => (
                    <a key={label} href={href} className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:border-[#f5a623] group"
                      style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)" }}>
                        <Icon size={18} className="text-black" />
                      </div>
                      <div>
                        <div className="text-sm font-bold group-hover:text-[#f5a623] transition-colors" style={{ color: "var(--text-primary)" }}>{label}</div>
                        <div className="text-xs" style={{ color: "var(--text-faint)" }}>{handle}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Working hours */}
              <div className="rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)" }}>
                    <Clock size={16} className="text-black" />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{tr("contacts_hours_h")}</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {hours.map((row) => (
                    <div key={row.day} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
                      <span className="text-sm" style={{ color: "var(--text-muted)" }}>{row.day}</span>
                      <span className="text-sm font-semibold" style={{ color: row.special ? "#f5a623" : "var(--text-primary)" }}>{row.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
