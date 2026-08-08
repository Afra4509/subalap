"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Bot,
  Database,
  Home,
  LayoutDashboard,
  Map,
  Menu,
  Plus,
  Rss,
  Search,
  TrendingUp,
  X,
} from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/map", label: "Peta", icon: Map },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/assistant", label: "Asisten AI", icon: Bot },
  { href: "/data", label: "Pusat Data", icon: Database },
  { href: "/dashboard", label: "Dashboard Kota", icon: LayoutDashboard },
]

const BOTTOM_LINKS = LINKS.filter((item) =>
  ["/feed", "/map", "/trending", "/assistant"].includes(item.href),
)

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open])

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/90 backdrop-blur-xl">
        <div className="flex h-16 w-full items-center gap-3 pr-3 sm:pr-5">
          {/* Container ini selebar sidebar di desktop agar search bar bisa benar-benar ke-tengah konten utama */}
          <div className="flex shrink-0 items-center pl-3 sm:pl-5 lg:w-[232px] lg:border-r lg:border-border/70 lg:h-full lg:pr-5">
            <Link href="/" aria-label="SUBALAP — Beranda" className="flex shrink-0 items-center" onClick={() => setOpen(false)}>
              <BrandLogo
                markClassName="size-10"
                className="[&>span:last-child]:hidden sm:[&>span:last-child]:block"
                priority
              />
            </Link>
          </div>

          <div className="hidden flex-1 items-center justify-center md:flex">
            {/* Search bar diletakkan fleksibel di tengah navbar */}
            <form action="/feed" method="get" role="search" className="relative w-full max-w-lg">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                aria-label="Cari laporan warga Surabaya"
                placeholder="Cari laporan, wilayah, atau kategori..."
                className="h-10 w-full rounded-xl border border-border/70 bg-secondary/55 pl-10 pr-4 text-sm outline-none transition focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10"
              />
            </form>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Button
              render={<Link href="/feed#cari-laporan" />}
              nativeButton={false}
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Cari laporan warga"
            >
              <Search className="size-4" />
            </Button>
            <ThemeToggle />
            <Button
              render={<Link href="/report" />}
              nativeButton={false}
              size="sm"
              className="hidden gap-1.5 sm:inline-flex"
            >
              <Plus className="size-4" />
              Buat laporan
            </Button>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-secondary lg:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Tutup menu" : "Buka menu"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav
            id="mobile-navigation"
            aria-label="Navigasi utama"
            className="absolute inset-x-0 top-16 max-h-[calc(100dvh-8rem)] overflow-y-auto border-b border-border bg-card p-3 shadow-xl lg:hidden"
          >
            <div className="mx-auto grid max-w-xl gap-1">
              {LINKS.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <item.icon className="size-[18px]" />
                    {item.label}
                  </Link>
                )
              })}
              <Button render={<Link href="/report" />} nativeButton={false} className="mt-2 w-full">
                <Plus className="size-4" />
                Buat laporan tanpa login
              </Button>
            </div>
          </nav>
        )}
      </header>

      <nav
        data-bottom-nav
        aria-label="Navigasi cepat"
        className="fixed inset-x-0 bottom-0 z-40 grid h-[4.5rem] grid-cols-5 border-t border-border/80 bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgb(15_23_42_/_8%)] backdrop-blur-xl lg:hidden"
      >
        {BOTTOM_LINKS.slice(0, 2).map((item) => (
          <BottomLink key={item.href} item={item} active={pathname === item.href} />
        ))}
        <Link
          href="/report"
          aria-label="Buat laporan"
          aria-current={pathname === "/report" ? "page" : undefined}
          className="group flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground"
        >
          <span className="-mt-5 flex size-12 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Plus className="size-5" />
          </span>
          <span className={cn(pathname === "/report" && "text-primary")}>Lapor</span>
        </Link>
        {BOTTOM_LINKS.slice(2).map((item) => (
          <BottomLink key={item.href} item={item} active={pathname === item.href} />
        ))}
      </nav>
    </>
  )
}

function BottomLink({
  item,
  active,
}: {
  item: (typeof LINKS)[number]
  active: boolean
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-[10px] font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <item.icon className={cn("size-5", active && "stroke-[2.5]")} />
      {item.label}
    </Link>
  )
}
