"use client";

import Link from "next/link";
import { CapitoLogo } from "./logo";
import { useLang } from "../lang-provider";
import { makeT } from "./translations";

function IconInstagram({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconFacebook({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function IconYoutube({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  const { lang } = useLang();
  const tr = makeT(lang);

  const sections = [
    {
      heading: tr("footer_menu"),
      links: [
        { label: tr("cat_coffee"),    href: "/menu" },
        { label: tr("cat_cold"),      href: "/menu" },
        { label: tr("cat_bakery"),    href: "/menu" },
        { label: tr("cat_pizza"),     href: "/menu" },
        { label: tr("cat_pasta"),     href: "/menu" },
      ],
    },
    {
      heading: tr("footer_service"),
      links: [
        { label: tr("footer_delivery"),    href: "/" },
        { label: tr("footer_pickup"),      href: "/" },
        { label: tr("footer_reservation"), href: "/" },
        { label: tr("footer_loyalty"),     href: "/" },
      ],
    },
    {
      heading: tr("footer_company"),
      links: [
        { label: tr("nav_about"),        href: "/about"    },
        { label: tr("nav_branches"),     href: "/branches" },
        { label: tr("nav_contacts"),     href: "/contacts" },
        { label: tr("footer_vacancies"), href: "/contacts" },
      ],
    },
  ];

  return (
    <footer id="contact" className="border-t" style={{ background: "var(--bg-base)", borderColor: "var(--border-gold)" }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Link href="/" className="flex items-center">
              <CapitoLogo size={56} />
            </Link>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--text-faint)" }}>
              {tr("footer_desc")}
            </p>
            <div className="flex items-center gap-3">
              {[
                { Icon: IconInstagram, label: "Instagram" },
                { Icon: IconFacebook,  label: "Facebook"  },
                { Icon: IconYoutube,   label: "YouTube"   },
              ].map(({ Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 hover:border-[#f5a623] hover:text-[#f5a623]"
                  style={{ borderColor: "var(--social-border)", color: "var(--social-color)" }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {sections.map((sec) => (
            <div key={sec.heading}>
              <h4 className="font-bold text-sm mb-4 tracking-wide" style={{ color: "var(--text-primary)" }}>
                {sec.heading}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {sec.links.map((lnk) => (
                  <li key={lnk.label}>
                    <Link href={lnk.href} className="text-sm hover:text-[#f5a623] transition-colors" style={{ color: "var(--text-faint)" }}>
                      {lnk.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "var(--border-gold)" }}>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>{tr("footer_rights")}</p>
          <div className="flex items-center text-xs gap-3" style={{ color: "var(--text-faint)" }}>
            <span>Bishkek, Kyrgyzstan</span>
            <span>·</span>
            <a href="#" className="hover:text-[#f5a623] transition-colors">{tr("footer_privacy")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
