"use client";

import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Clock,
  ChevronRight,
  ArrowRight,
  Award,
  Calendar,
} from "lucide-react";
import { Navbar }     from "./components/navbar";
import { Footer }     from "./components/footer";
import {
  FEATURES,
  ALL_BRANCHES,
} from "./components/shared-data";
import { useLang } from "./lang-provider";
import { makeT }  from "./components/translations";

// ─── Hero cup photo ────────────────────────────────────────────────────────────

function HeroCupIllustration({ size = 380 }: { size?: number }) {
  return (
    <Image
      src="/hero-cup.png"
      alt="Capito Coffee cup"
      width={size}
      height={size}
      priority
      style={{ objectFit: "contain", width: "100%", height: "100%" }}
    />
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

export function Hero() {
  const { lang } = useLang();
  const tr = makeT(lang);
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: "var(--hero-radial)" }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(245,166,35,0.3),transparent)" }} />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 w-full pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-7">
            <div className="flex items-center gap-3">
              <div className="divider-gold" />
              <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>
                {tr("hero_label")}
              </span>
            </div>
            <h1 className="text-6xl sm:text-7xl font-black leading-none tracking-tight uppercase" style={{ color: "var(--text-primary)" }}>
              {tr("hero_h1_1")}<br />
              <span className="text-gold-gradient">{tr("hero_h1_2")}</span><br />
              <span className="text-gold-gradient">{tr("hero_h1_3")}</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {tr("hero_desc")}
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <Link
                href="/menu"
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000", boxShadow: "0 8px 24px rgba(245,166,35,0.25)" }}
              >
                {tr("hero_cta")} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute w-[380px] h-[380px] rounded-full blur-3xl" style={{ background: "rgba(245,166,35,0.12)" }} />
            <div className="relative w-[360px] h-[360px] drop-shadow-2xl">
              <HeroCupIllustration size={360} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to top,var(--bg-base),transparent)" }} />
    </section>
  );
}

// ─── About ─────────────────────────────────────────────────────────────────────

export function AboutPreview() {
  const { lang } = useLang();
  const tr = makeT(lang);

  const stats = [
    { value: "13",   label: tr("stat_branches") },
    { value: "2018", label: tr("stat_founded")  },
    { value: "100%", label: tr("stat_arabica")  },
  ];
  const features = [
    tr("feat_wifi"), tr("feat_parking"), tr("feat_kids"), tr("feat_work"), tr("feat_terrace"),
  ];

  return (
    <section className="py-24 overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div
              className="relative rounded-2xl overflow-hidden h-[480px] border"
              style={{ borderColor: "var(--border-gold)" }}
            >
              <Image
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=85&auto=format&fit=crop"
                alt="Capito Coffee — атмосфера кофейни"
                fill
                unoptimized
                priority
                style={{ objectFit: "cover" }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top,color-mix(in srgb,var(--bg-base) 65%,transparent),transparent 50%)" }} />
              <div className="absolute bottom-6 left-6 right-6">
                <div
                  className="rounded-xl p-4 border backdrop-blur-sm"
                  style={{ background: "color-mix(in srgb,var(--bg-card) 90%,transparent)", borderColor: "var(--border-gold)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)" }}
                    >
                      <Award size={18} className="text-black" />
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{tr("about_badge")}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{tr("about_badge_sub")}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-7">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="divider-gold" />
                <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>{tr("about_label")}</span>
              </div>
              <h2 className="text-4xl font-black leading-tight" style={{ color: "var(--text-primary)" }}>
                {tr("about_h2_1")}<br />{tr("about_h2_2")} <span className="text-gold-gradient">{tr("about_h2_gold")}</span>
              </h2>
            </div>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>{tr("about_desc")}</p>
            <div className="grid grid-cols-3 gap-4 py-6 border-y" style={{ borderColor: "var(--border-gold)" }}>
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-black text-gold-gradient leading-none">{s.value}</div>
                  <div className="text-xs mt-1.5 font-medium tracking-wide" style={{ color: "var(--text-faint)" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {FEATURES.map(({ icon: Icon }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium"
                  style={{ borderColor: "var(--pill-border)", background: "var(--pill-bg)", color: "#f5a623" }}
                >
                  <Icon size={13} /> {features[i]}
                </div>
              ))}
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full border font-bold text-sm transition-all duration-200 w-fit hover:bg-[#f5a623] hover:text-black"
              style={{ borderColor: "#f5a623", color: "#f5a623" }}
            >
              {tr("about_more")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Branches ──────────────────────────────────────────────────────────────────

export function BranchesPreview() {
  const { lang } = useLang();
  const tr = makeT(lang);
  const branches = ALL_BRANCHES.slice(0, 4);

  return (
    <section className="py-24" style={{ background: "var(--bg-surface)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="divider-gold" />
              <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>{tr("branches_label")}</span>
            </div>
            <h2 className="text-4xl font-black leading-tight" style={{ color: "var(--text-primary)" }}>
              {tr("branches_h2_1")}<br />{tr("branches_h2_2")}
            </h2>
          </div>
          <Link href="/branches" className="flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all" style={{ color: "#f5a623" }}>
            {tr("branches_all")} <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {branches.map((branch) => (
            <div
              key={branch.name}
              className="card-hover card-depth group relative rounded-2xl overflow-hidden border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
            >
              <div className="relative h-44 overflow-hidden" style={{ background: "var(--branch-img-bg)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={branch.image}
                  alt={branch.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top,var(--bg-card) 10%,transparent 70%)" }} />
                {branch.is24 && (
                  <div
                    className="absolute top-3 right-3 text-black text-[10px] font-black px-2.5 py-1 rounded-full tracking-wider"
                    style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)" }}
                  >24/7</div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  <MapPin size={13} style={{ color: "#f5a623" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>{tr("branch_bishkek")}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-sm mb-1.5 leading-snug" style={{ color: "var(--text-primary)" }}>{branch.name}</h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-faint)" }}>{branch.description}</p>
                <div className="flex items-center gap-2">
                  <Clock size={12} style={{ color: "rgba(245,166,35,0.6)" }} />
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {branch.is24 ? tr("branch_24") : tr("branch_hours")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/branches"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full border text-sm font-semibold transition-all duration-200 hover:bg-[#f5a623] hover:text-black hover:border-[#f5a623]"
            style={{ borderColor: "rgba(245,166,35,0.35)", background: "rgba(245,166,35,0.06)", color: "#f5a623" }}
          >
            <MapPin size={15} /> {tr("branches_all13")}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Promo ─────────────────────────────────────────────────────────────────────

export function PromoBanner() {
  const { lang } = useLang();
  const tr = makeT(lang);
  return (
    <section className="py-8" style={{ background: "var(--bg-surface)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden border" style={{ background: "var(--promo-bg)", borderColor: "var(--border-gold)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 50%,rgba(245,166,35,0.09) 0%,transparent 60%)" }} />
          <div className="relative px-10 py-12 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="divider-gold" />
                <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>{tr("promo_label")}</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-8xl font-black text-gold-gradient leading-none">{tr("promo_percent")}</span>
                <div>
                  <p className="text-xl font-black leading-tight" style={{ color: "var(--text-primary)" }}>{tr("promo_title")}</p>
                  <p className="text-sm mt-1 whitespace-pre-line" style={{ color: "var(--text-muted)" }}>{tr("promo_desc")}</p>
                </div>
              </div>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm w-fit transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000", boxShadow: "0 8px 24px rgba(245,166,35,0.25)" }}
              >
                {tr("promo_btn")} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="relative w-64 h-64 flex-shrink-0">
              <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: "radial-gradient(ellipse,rgba(245,166,35,0.12),transparent 70%)" }} />
              <HeroCupIllustration size={256} />
              <div
                className="absolute top-4 right-0 rounded-xl px-3 py-2 text-center border"
                style={{ background: "rgba(245,166,35,0.08)", borderColor: "rgba(245,166,35,0.3)" }}
              >
                <div className="text-[10px] font-bold leading-tight" style={{ color: "#f5a623" }}>Cold Coffee<br />Hot Days</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── BookingCTA ────────────────────────────────────────────────────────────────

export function BookingCTA() {
  const { lang } = useLang();
  const tr = makeT(lang);
  return (
    <section className="py-24" style={{ background: "var(--bg-surface)" }}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <span className="text-xs font-semibold tracking-[0.25em] uppercase block mb-4" style={{ color: "#f5a623" }}>{tr("booking_label")}</span>
        <h2 className="text-4xl font-black mb-4 leading-tight" style={{ color: "var(--text-primary)" }}>
          {tr("booking_h2_1")}<br /><span className="text-gold-gradient">{tr("booking_h2_2")}</span>
        </h2>
        <p className="text-base max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {tr("booking_desc")}
        </p>
        <Link
          href="/booking"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base transition-all duration-200 hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#fff", boxShadow: "0 12px 32px rgba(245,166,35,0.3)" }}
        >
          <Calendar size={18} color="#fff" /> {tr("booking_btn")}
        </Link>
      </div>
    </section>
  );
}
