import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import { LangProvider } from "./lang-provider";
import { AuthProvider } from "./auth-provider";
import { CartProvider } from "./cart-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Capito Coffee — Вкус, который вдохновляет",
  description:
    "Capito Coffee — сеть премиальных кофеен в Бишкеке. Авторский кофе, итальянская кухня, bakery и атмосфера, которая вдохновляет. Доставка, самовывоз, бронирование столиков.",
  keywords: "Capito Coffee, кофейня Бишкек, кофе Бишкек, кофейня, доставка кофе",
  openGraph: {
    title: "Capito Coffee — Вкус, который вдохновляет",
    description: "Сеть премиальных кофеен в Бишкеке",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        {/* Blocking script: restore theme + lang before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem('capito-theme');
              if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}
              else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}
              var l=localStorage.getItem('capito-lang');
              if(l&&['ru','en','kg'].includes(l)){document.documentElement.setAttribute('lang',l);}
            }catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
        <ThemeProvider>
          <LangProvider>
            <AuthProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </AuthProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
