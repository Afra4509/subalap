"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BrandLogo } from "@/components/brand-logo"

const footerLinks = [
  { href: "/feed", label: "Feed" },
  { href: "/map", label: "Peta" },
  { href: "/trending", label: "Trending" },
  { href: "/assistant", label: "Asisten AI" },
  { href: "/report", label: "Buat Laporan" },
]

export function SiteFooter() {
  const pathname = usePathname()
  if (pathname === "/map" || pathname === "/feed") return null

  return (
    <footer className="border-t border-border/60 bg-card/55 pb-20 lg:pb-0">
      <div className="mx-auto flex max-w-[1368px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" aria-label="SUBALAP — Beranda" className="w-fit">
          <BrandLogo showTagline markClassName="size-11" />
        </Link>
        <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground">Kota Surabaya · dari warga, untuk warga</p>
      </div>
    </footer>
  )
}
