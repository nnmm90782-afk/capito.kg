"use client";

import Link from "next/link";
import { ChevronRight, ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { useLang } from "../lang-provider";
import { makeT } from "./translations";
import { useCart } from "../cart-provider";

export interface PopularDrinkItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  badge: string;
  image_url: string | null;
}

const ACCENTS = ["#f5a623", "#ffc84a"];

export default function PopularDrinksClient({ drinks }: { drinks: PopularDrinkItem[] }) {
  const { lang } = useLang();
  const tr = makeT(lang);
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

  function handleAdd(item: PopularDrinkItem) {
    add({ id: item.id, name: item.name, price: item.price, image_url: item.image_url });
    setJustAdded((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setJustAdded((prev) => {
        const n = new Set(prev);
        n.delete(item.id);
        return n;
      });
    }, 1400);
  }

  return (
    <section className="py-24" style={{ background: "var(--bg-surface)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="divider-gold" />
              <span className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "#f5a623" }}>
                {tr("popular_label")}
              </span>
            </div>
            <h2 className="text-4xl font-black leading-tight" style={{ color: "var(--text-primary)" }}>
              {tr("popular_h2_1")}<br />{tr("popular_h2_2")}
            </h2>
          </div>
          <Link
            href="/menu"
            className="flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
            style={{ color: "#f5a623" }}
          >
            {tr("popular_all")} <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {drinks.map((drink, idx) => {
            const accent = ACCENTS[idx % ACCENTS.length];
            const added = justAdded.has(drink.id);
            return (
              <div
                key={drink.id}
                className="card-hover card-depth group relative rounded-2xl overflow-hidden cursor-pointer border flex flex-col"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-gold)" }}
              >
                {/* Image */}
                <div className="relative h-52 flex items-center justify-center overflow-hidden" style={{ background: "var(--drink-img-bg)" }}>
                  {drink.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={drink.image_url}
                      alt={drink.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-28 h-28 opacity-40">
                      <svg viewBox="0 0 100 100" fill="none">
                        <path d="M15 40 Q17 70 50 72 Q83 70 85 40 Z" fill={accent} />
                        <ellipse cx="50" cy="40" rx="35" ry="8" fill={accent} opacity="0.7" />
                        <path d="M85 48 Q96 48 96 56 Q96 64 85 64" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
                        <path d="M44 38 Q40 28 44 20 Q42 28 48 24 Q44 32 50 28 Q46 36 44 38Z" fill={accent} opacity="0.8" />
                      </svg>
                    </div>
                  )}
                  {drink.badge && (
                    <div
                      className="absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-full"
                      style={{ background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }}
                    >
                      {drink.badge}
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 text-[10px] font-bold tracking-widest opacity-20" style={{ color: accent }}>
                    CAPITO
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>
                    {drink.name}
                  </h3>
                  <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: "var(--text-faint)" }}>
                    {drink.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-black text-lg" style={{ color: "#f5a623" }}>
                      {drink.price} {tr("currency")}
                    </span>
                    <button
                      onClick={() => handleAdd(drink)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95"
                      style={
                        added
                          ? { background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.4)" }
                          : { background: "linear-gradient(135deg,#f5a623,#c47d0e)", color: "#000" }
                      }
                      aria-label={tr("order_btn")}
                    >
                      {added ? (
                        <><Check size={12} /> {tr("order_added")}</>
                      ) : (
                        <><ShoppingCart size={12} /> {tr("order_btn")}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
