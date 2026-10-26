"use client";

import { useState } from "react";
import { MapPin, Clock, Phone, ChevronRight, Search } from "lucide-react";
import { PageShell } from "../components/page-shell";
import { ALL_BRANCHES } from "../components/shared-data";
import { useLang } from "../lang-provider";
import { makeT } from "../components/translations";

export default function BranchesPage() {
  const { lang } = useLang();
  const tr = makeT(lang);

  const DISTRICTS_MAP: Record<string, string> = {
    "Все":                  tr("branches_all_dist"),
    "Центр":                lang === "en" ? "Center" : lang === "kg" ? "Борбор" : "Центр",
    "Манаса / Айтматова":   lang === "en" ? "Manas / Aitmatov" : lang === "kg" ? "Манас / Айтматов" : "Манаса / Айтматова",
    "Другие районы":        lang === "en" ? "Other districts" : lang === "kg" ? "Башка райондор" : "Другие районы",
  };

  const DISTRICTS = Object.keys(DISTRICTS_MAP);
  const [activeDistrict, setActiveDistrict] = useState("Все");
  const [query, setQuery] = useState("");

  const filtered = ALL_BRANCHES.filter((b) => {
    const matchDistrict = activeDistrict === "Все" || b.district === activeDistrict;
    const matchQuery = b.name.toLowerCase().includes(query.toLowerCase()) || b.district.toLowerCase().includes(query.toLowerCase());
    return matchDistrict && matchQuery;
  });

  return (
    <PageShell>
      {/* Hero */}
      <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg-base)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--hero-radial)" }} />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="divider-gold" />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>{tr("branches_label")}</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black leading-none mb-4" style={{ color: "var(--text-primary)" }}>
            {tr("branches_page_h1_1")}<br /><span className="text-gold-gradient">{tr("branches_page_h1_2")}</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {tr("branches_page_desc")}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 border-b py-3" style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <input type="text" placeholder={tr("branches_search")} value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-full text-sm outline-none border transition-all"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)", color: "var(--text-primary)" }} />
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-2">
            {DISTRICTS.map((d) => (
              <button key={d} onClick={() => setActiveDistrict(d)}
                className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200"
                style={activeDistrict === d
                  ? { background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }
                  : { background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                {DISTRICTS_MAP[d]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-14" style={{ background: "var(--bg-surface)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sm mb-8" style={{ color: "var(--text-faint)" }}>
            {tr("branches_found")} <span className="font-bold" style={{ color: "var(--text-primary)" }}>{filtered.length}</span> {tr("branches_branches")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((branch) => (
              <div key={branch.name} className="card-hover card-depth rounded-2xl border overflow-hidden"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}>
                <div className="h-44 relative overflow-hidden" style={{ background: "var(--branch-img-bg)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={branch.image}
                    alt={branch.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top,var(--bg-card) 10%,transparent 70%)" }} />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
                      style={{ background: "var(--pill-bg)", border: "1px solid var(--pill-border)", color: "#f5a623" }}>
                      {DISTRICTS_MAP[branch.district] ?? branch.district}
                    </span>
                  </div>
                  {branch.is24 && (
                    <div className="absolute top-3 right-3 text-black text-[10px] font-black px-2.5 py-1 rounded-full tracking-wider"
                      style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)" }}>24/7</div>
                  )}
                </div>
                <div className="p-5 flex flex-col gap-3">
                  <h3 className="font-bold text-base leading-snug" style={{ color: "var(--text-primary)" }}>{branch.name}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>{branch.description}</p>
                  <div className="flex flex-col gap-2 pt-1 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center gap-2">
                      <Clock size={12} style={{ color: "rgba(245,166,35,0.7)" }} />
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                        {branch.is24 ? tr("branch_24") : branch.hours}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={12} style={{ color: "rgba(245,166,35,0.7)" }} />
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>{tr("branch_bishkek")}, {branch.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={12} style={{ color: "rgba(245,166,35,0.7)" }} />
                      <a href={`tel:${branch.phone}`} className="text-xs hover:text-[#f5a623] transition-colors" style={{ color: "var(--text-faint)" }}>
                        {branch.phone}
                      </a>
                    </div>
                  </div>
                  <button className="mt-1 w-full py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 border transition-all hover:bg-[#f5a623] hover:text-black hover:border-[#f5a623]"
                    style={{ borderColor: "var(--border-gold)", color: "#f5a623" }}>
                    {tr("branches_on_map")} <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
