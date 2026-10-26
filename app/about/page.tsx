"use client";

import { Award, MapPin, ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "../components/page-shell";
import { REVIEWS, FEATURES } from "../components/shared-data";
import { useLang } from "../lang-provider";
import { makeT } from "../components/translations";

const VALUES_KEYS = [
  { icon: Award, title: "val_quality",    desc: "val_quality_d"    },
  { icon: Award, title: "val_fresh",      desc: "val_fresh_d"      },
  { icon: Award, title: "val_atmosphere", desc: "val_atmosphere_d" },
  { icon: Award, title: "val_craft",      desc: "val_craft_d"      },
] as const;

const TEAM = [
  { name: "Азамат К.",  role_ru: "Основатель & CEO",       role_en: "Founder & CEO",         role_kg: "Негиздөөчү & CEO",     initial: "А" },
  { name: "Айнура Т.",  role_ru: "Шеф-бариста",            role_en: "Head Barista",           role_kg: "Башкы бариста",        initial: "А" },
  { name: "Бакыт А.",   role_ru: "Шеф-повар",               role_en: "Head Chef",              role_kg: "Башкы аш бышыруучу",  initial: "Б" },
  { name: "Динара С.",  role_ru: "Директор по маркетингу",  role_en: "Marketing Director",    role_kg: "Маркетинг директору",  initial: "Д" },
];

export default function AboutPage() {
  const { lang } = useLang();
  const tr = makeT(lang);

  const featureLabels = [
    tr("feat_wifi"), tr("feat_parking"), tr("feat_kids"), tr("feat_work"), tr("feat_terrace"),
  ];

  const teamRole = (m: typeof TEAM[0]) =>
    lang === "en" ? m.role_en : lang === "kg" ? m.role_kg : m.role_ru;

  const stats = [
    { value: "13",   label: tr("stat_branches") },
    { value: "2018", label: tr("stat_founded")  },
    { value: "100%", label: tr("stat_arabica")  },
  ];

  return (
    <PageShell>
      {/* Hero */}
      <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg-base)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--hero-radial)" }} />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="divider-gold" />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>{tr("about_label")}</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black leading-none mb-6" style={{ color: "var(--text-primary)" }}>
            {tr("about_page_h1_1")}<br />{tr("about_page_h1_2")} <span className="text-gold-gradient">{tr("about_h2_gold")}</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {tr("about_page_desc")}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y" style={{ background: "var(--bg-surface)", borderColor: "var(--border-gold)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-6 sm:gap-12">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-5xl font-black text-gold-gradient leading-none mb-2">{s.value}</div>
                <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24" style={{ background: "var(--bg-base)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="rounded-2xl border h-[420px] relative overflow-hidden"
              style={{ borderColor: "var(--border-gold)" }}>
              <Image
                src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&q=85&auto=format&fit=crop"
                alt="Capito Coffee — наша история"
                fill
                unoptimized
                style={{ objectFit: "cover" }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top,color-mix(in srgb,var(--bg-base) 60%,transparent),transparent 50%)" }} />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="rounded-xl p-4 border backdrop-blur-sm"
                  style={{ background: "color-mix(in srgb,var(--bg-card) 90%,transparent)", borderColor: "var(--border-gold)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)" }}>
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

            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="divider-gold" />
                  <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>{tr("about_story_label")}</span>
                </div>
                <h2 className="text-3xl font-black leading-tight mb-4" style={{ color: "var(--text-primary)" }}>
                  {tr("about_story_h2")} <span className="text-gold-gradient">2018</span>
                </h2>
              </div>
              <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>{tr("about_story_p1")}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-faint)" }}>{tr("about_story_p2")}</p>
              <div className="flex flex-wrap gap-3">
                {FEATURES.map(({ icon: Icon }, i) => (
                  <div key={i} className="flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium"
                    style={{ borderColor: "var(--pill-border)", background: "var(--pill-bg)", color: "#f5a623" }}>
                    <Icon size={13} /> {featureLabels[i]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24" style={{ background: "var(--bg-surface)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-[0.25em] uppercase block mb-3" style={{ color: "#f5a623" }}>{tr("about_values_label")}</span>
            <h2 className="text-4xl font-black" style={{ color: "var(--text-primary)" }}>
              {tr("about_values_h2")} <span className="text-gold-gradient">{tr("about_values_gold")}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES_KEYS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover card-depth rounded-2xl border p-7 flex flex-col gap-4"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)" }}>
                  <Icon size={22} className="text-black" />
                </div>
                <h3 className="font-black text-base" style={{ color: "var(--text-primary)" }}>{tr(title)}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-faint)" }}>{tr(desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24" style={{ background: "var(--bg-base)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="divider-gold" />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>{tr("about_team_label")}</span>
          </div>
          <h2 className="text-4xl font-black mb-12" style={{ color: "var(--text-primary)" }}>
            {tr("about_team_h2")} <span className="text-gold-gradient">Capito</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM.map((member) => (
              <div key={member.name} className="card-hover card-depth rounded-2xl border p-6 text-center"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-black text-black"
                  style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)" }}>{member.initial}</div>
                <div className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{member.name}</div>
                <div className="text-xs" style={{ color: "var(--text-faint)" }}>{teamRole(member)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-24" style={{ background: "var(--bg-surface)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-[0.25em] uppercase block mb-3" style={{ color: "#f5a623" }}>{tr("reviews_label")}</span>
            <h2 className="text-4xl font-black" style={{ color: "var(--text-primary)" }}>
              {tr("reviews_h2_1")} <span className="text-gold-gradient">{tr("reviews_h2_2")}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((r, i) => (
              <div key={i} className="card-hover card-depth rounded-2xl border p-7 flex flex-col gap-5"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}>
                <div className="flex gap-1">{Array.from({ length: r.rating }).map((_, si) => <Star key={si} size={14} fill="#f5a623" style={{ color: "#f5a623" }} />)}</div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text-muted)" }}>&ldquo;{r.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "var(--border-gold)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-black font-black text-sm"
                    style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)" }}>{r.name[0]}</div>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: "var(--bg-base)" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-4" style={{ color: "var(--text-primary)" }}>
            {tr("about_cta_h2")} <span className="text-gold-gradient">{tr("about_cta_gold")}</span>
          </h2>
          <p className="text-base mb-8" style={{ color: "var(--text-muted)" }}>{tr("about_cta_desc")}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/branches" className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}>
              <MapPin size={16} /> {tr("about_find_branch")}
            </Link>
            <Link href="/menu" className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full border font-bold text-sm transition-all hover:bg-[#f5a623] hover:text-black"
              style={{ borderColor: "#f5a623", color: "#f5a623" }}>
              {tr("about_view_menu")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
