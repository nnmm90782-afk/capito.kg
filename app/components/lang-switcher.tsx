"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useLang, type Lang } from "../lang-provider";

const LANGS: { code: Lang; label: string; name: string }[] = [
  { code: "ru", label: "RU", name: "Русский"   },
  { code: "en", label: "EN", name: "English"   },
  { code: "kg", label: "KG", name: "Кыргызча" },
];

// Inline SVG flags — crisp on all platforms
function FlagRU({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size * (2 / 3)} viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="30" height="20" fill="#fff" />
      <rect y="6.66" width="30" height="6.68" fill="#0039A6" />
      <rect y="13.34" width="30" height="6.66" fill="#D52B1E" />
    </svg>
  );
}

function FlagEN({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size * (2 / 3)} viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="60" height="40" fill="#012169" />
      {/* White diagonals */}
      <line x1="0" y1="0" x2="60" y2="40" stroke="#fff" strokeWidth="8" />
      <line x1="60" y1="0" x2="0" y2="40" stroke="#fff" strokeWidth="8" />
      {/* Red diagonals */}
      <line x1="0" y1="0" x2="60" y2="40" stroke="#C8102E" strokeWidth="4" />
      <line x1="60" y1="0" x2="0" y2="40" stroke="#C8102E" strokeWidth="4" />
      {/* White cross */}
      <rect x="25" y="0"  width="10" height="40" fill="#fff" />
      <rect x="0"  y="15" width="60" height="10" fill="#fff" />
      {/* Red cross */}
      <rect x="27" y="0"  width="6"  height="40" fill="#C8102E" />
      <rect x="0"  y="17" width="60" height="6"  fill="#C8102E" />
    </svg>
  );
}

function FlagKG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: "50%", flexShrink: 0 }}>
      <circle cx="20" cy="20" r="20" fill="#E8112D" />
      {/* Sun circle */}
      <circle cx="20" cy="20" r="9" fill="#FFCD00" fillOpacity="0.0" stroke="#FFCD00" strokeWidth="0" />
      {/* 40 rays — simplified as circle + lines */}
      {Array.from({ length: 40 }).map((_, i) => {
        const angle = (i * 9 * Math.PI) / 180;
        const x1 = 20 + 7  * Math.cos(angle);
        const y1 = 20 + 7  * Math.sin(angle);
        const x2 = 20 + 10 * Math.cos(angle);
        const y2 = 20 + 10 * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFCD00" strokeWidth="1" />;
      })}
      <circle cx="20" cy="20" r="6" fill="#FFCD00" />
      {/* Tunduk (top pattern) */}
      <circle cx="20" cy="20" r="3.5" fill="#E8112D" />
      <line x1="20" y1="16.5" x2="20" y2="23.5" stroke="#FFCD00" strokeWidth="1" />
      <line x1="16.5" y1="20" x2="23.5" y2="20" stroke="#FFCD00" strokeWidth="1" />
      <line x1="17.5" y1="17.5" x2="22.5" y2="22.5" stroke="#FFCD00" strokeWidth="0.8" />
      <line x1="22.5" y1="17.5" x2="17.5" y2="22.5" stroke="#FFCD00" strokeWidth="0.8" />
    </svg>
  );
}

const FLAG_MAP: Record<Lang, (props: { size?: number }) => React.ReactElement> = {
  ru: FlagRU,
  en: FlagEN,
  kg: FlagKG,
};

export function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];
  const CurrentFlag = FLAG_MAP[current.code];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch language"
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-200 hover:border-[#f5a623] select-none"
        style={{
          borderColor: open ? "#f5a623" : "var(--border-gold)",
          background: "var(--bg-card)",
          color: open ? "#f5a623" : "var(--text-muted)",
        }}
      >
        <CurrentFlag size={18} />
        <span className="tracking-wider">{current.label}</span>
        <ChevronDown
          size={11}
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 rounded-2xl border overflow-hidden z-50"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-gold)",
            boxShadow: "var(--shadow-card)",
            minWidth: 130,
          }}
        >
          {LANGS.map((l) => {
            const isActive = l.code === lang;
            const Flag = FLAG_MAP[l.code];
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => { setLang(l.code); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-left transition-all"
                style={{
                  background: isActive ? "rgba(245,166,35,0.08)" : "transparent",
                  color: isActive ? "#f5a623" : "var(--text-muted)",
                }}
              >
                <Flag size={18} />
                <span className="tracking-wider">{l.label}</span>
                <span className="flex-1" style={{ color: "var(--text-faint)", fontWeight: 400 }}>{l.name}</span>
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "#f5a623" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
