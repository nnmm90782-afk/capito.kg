"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { PageShell } from "../components/page-shell";
import { useLang } from "../lang-provider";
import { makeT } from "../components/translations";
import { useCart } from "../cart-provider";

export interface MenuCategory { slug: string; name: string }
export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  badge: string;
  image_url: string | null;
}

const ACCENTS = ["#f5a623", "#ffc84a"];

export default function MenuClient({
  categories,
  itemsByCategory,
}: {
  categories: MenuCategory[];
  itemsByCategory: Record<string, MenuItem[]>;
}) {
  const { lang } = useLang();
  const tr = makeT(lang);
  const { add } = useCart();
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug ?? "coffee");
  // Track which items were just added (for the "Добавлено" flash)
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

  function handleAdd(item: MenuItem) {
    add({ id: item.id, name: item.name, price: item.price, image_url: item.image_url });
    setJustAdded((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setJustAdded((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 1400);
  }

  const catLabelMap: Record<string, string> = {
    coffee:    tr("cat_coffee"),
    signature: tr("cat_signature"),
    cold:      tr("cat_cold"),
    tea:       tr("cat_tea"),
    bakery:    tr("cat_bakery"),
    pizza:     tr("cat_pizza"),
    pasta:     tr("cat_pasta"),
    breakfast: tr("cat_breakfast"),
  };

  const activeCat = categories.find((c) => c.slug === activeSlug) ?? categories[0];
  const items = itemsByCategory[activeSlug] ?? [];

  return (
    <PageShell>
      {/* Hero */}
      <section className="py-20 relative overflow-hidden" style={{ background: "var(--bg-base)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--hero-radial)" }} />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="divider-gold" />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>{tr("menu_label")}</span>
          </div>
          <h1 className="text-5xl font-black leading-none mb-4" style={{ color: "var(--text-primary)" }}>
            {tr("menu_h1")} <span className="text-gold-gradient">{tr("menu_h1_gold")}</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {tr("menu_desc")}
          </p>
        </div>
      </section>

      {/* Sticky category tabs */}
      <section className="sticky top-16 z-30 border-b" style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex overflow-x-auto no-scrollbar gap-1 py-2">
            {categories.map((cat) => {
              const isActive = cat.slug === activeSlug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setActiveSlug(cat.slug)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0"
                  style={isActive
                    ? { background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }
                    : { background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                >
                  {catLabelMap[cat.slug] ?? cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Items grid */}
      <section className="py-14" style={{ background: "var(--bg-surface)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
              {catLabelMap[activeCat?.slug ?? ""] ?? activeCat?.name}
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>В этой категории пока нет товаров</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {items.map((item, idx) => {
                const accent = ACCENTS[idx % ACCENTS.length];
                const added = justAdded.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="card-hover card-depth group rounded-2xl overflow-hidden border flex flex-col"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
                  >
                    {/* Image */}
                    <div className="h-44 flex items-center justify-center relative" style={{ background: "var(--drink-img-bg)" }}>
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-20 h-20 opacity-35">
                          <svg viewBox="0 0 100 100" fill="none">
                            <path d="M15 40 Q17 70 50 72 Q83 70 85 40 Z" fill={accent} />
                            <ellipse cx="50" cy="40" rx="35" ry="8" fill={accent} opacity="0.7" />
                            <path d="M85 48 Q96 48 96 56 Q96 64 85 64" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                      {item.badge && (
                        <div className="absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-full"
                          style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}>
                          {item.badge}
                        </div>
                      )}
                      <div className="absolute bottom-2 right-3 text-[9px] font-bold tracking-widest opacity-20" style={{ color: accent }}>CAPITO</div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{item.name}</h3>
                      {item.description && (
                        <p className="text-xs leading-relaxed mb-3 flex-1" style={{ color: "var(--text-faint)" }}>{item.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="font-black text-lg" style={{ color: "#f5a623" }}>
                          {item.price.toLocaleString("ru-RU")} {tr("currency")}
                        </span>
                        <button
                          onClick={() => handleAdd(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95"
                          style={added
                            ? { background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.4)" }
                            : { background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }
                          }
                          aria-label={tr("order_btn")}
                        >
                          {added
                            ? <><Check size={12} /> {tr("order_added")}</>
                            : <><ShoppingCart size={12} /> {tr("order_btn")}</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
