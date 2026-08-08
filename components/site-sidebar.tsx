"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bot,
  Database,
  Home,
  LayoutDashboard,
  Map,
  Plus,
  Rss,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAVIGATION = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/feed", label: "Feed warga", icon: Rss },
  { href: "/map", label: "Peta kondisi", icon: Map },
  { href: "/trending", label: "Isu trending", icon: TrendingUp },
  { href: "/assistant", label: "Asisten AI", icon: Bot },
  { href: "/data", label: "Pusat data", icon: Database },
  { href: "/dashboard", label: "Dashboard kota", icon: LayoutDashboard },
]

export function SiteSidebar() {
  const pathname = usePathname()

  return (
    <aside data-site-sidebar className="hidden w-[232px] shrink-0 border-r border-border/70 bg-card/65 lg:block">
      <div className="sticky top-16 flex max-h-[calc(100dvh-4rem)] flex-col gap-5 overflow-y-auto px-3 py-5">
        <div className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Warga Surabaya</p>
              <p className="text-xs text-muted-foreground">Akses publik · tanpa login</p>
            </div>
          </div>
        </div>

        <nav aria-label="Navigasi samping" className="grid gap-1">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Menu utama
          </p>
          {NAVIGATION.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {active && <span className="absolute -left-3 h-7 w-1 rounded-r-full bg-primary" />}
                <item.icon className="size-[18px]" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/15">
          <p className="text-sm font-bold">Lihat masalah kota?</p>
          <p className="mt-1 text-xs leading-relaxed text-primary-foreground/80">
            Kirim laporan cepat. Identitas tidak tampil publik.
          </p>
          <Button
            render={<Link href="/report" />}
            nativeButton={false}
            variant="secondary"
            size="sm"
            className="mt-3 w-full bg-white text-slate-900 hover:bg-white/90"
          >
            <Plus className="size-4" />
            Buat laporan
          </Button>
        </div>
      </div>
    </aside>
  )
}
