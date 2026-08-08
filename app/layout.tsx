import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { SiteFooter } from "@/components/site-footer"
import { SiteNav } from "@/components/site-nav"
import { SiteSidebar } from "@/components/site-sidebar"
import { SocialRightRail } from "@/components/social-right-rail"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { isDemoMode } from "@/lib/db"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "SUBALAP — Suara Warga, Kecerdasan Kota",
    template: "%s · SUBALAP",
  },
  description:
    "Platform laporan warga Surabaya tanpa login: kirim laporan, pantau peta kondisi, trending, dashboard, dan asisten kota.",
  applicationName: "SUBALAP",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "SUBALAP — Suara Warga, Kecerdasan Kota",
    description: "Laporan warga Surabaya, dari warga untuk warga. Tanpa login.",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/brand/subalap-og.jpg",
        width: 1200,
        height: 630,
        alt: "SUBALAP — Suara Warga, Kecerdasan Kota",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/subalap-og.jpg"],
  },
}

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#101a24" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className="bg-background"
    >
      <body className="flex min-h-screen flex-col overflow-x-clip font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="subalap-theme"
        >
        <a
          href="#main-content"
          className="fixed left-4 top-3 z-[1000] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0"
        >
          Lewati ke konten
        </a>
        <SiteNav />
        {isDemoMode && (
          <div className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-300">
            Mode tanpa database · dataset terverifikasi aktif, laporan baru tersimpan di perangkat ini.
          </div>
        )}
        <div className="flex w-full flex-1">
          <SiteSidebar />
          <div id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none">
            {children}
          </div>
          <SocialRightRail />
        </div>
        <SiteFooter />
        <Toaster position="top-center" />
          {process.env.VERCEL && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
