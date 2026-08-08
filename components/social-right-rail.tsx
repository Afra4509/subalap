"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowUpRight,
  Bot,
  LayoutDashboard,
  Map,
  Plus,
  TrendingUp,
} from "lucide-react"
import { CATEGORIES } from "@/lib/categories"
import { CategoryIcon } from "@/components/category-icon"

const QUICK_LINKS = [
  { href: "/map", label: "Peta kondisi kota", caption: "Marker isu terpantau", icon: Map },
  { href: "/trending", label: "Trending Surabaya", caption: "Urutan Impact Score", icon: TrendingUp },
  { href: "/dashboard", label: "Dashboard kota", caption: "Ringkasan prioritas", icon: LayoutDashboard },
]

export function SocialRightRail() {
  const pathname = usePathname()
  if (pathname !== "/" && pathname !== "/feed") return null

  return (
    <aside data-right-rail className="hidden w-[300px] shrink-0 border-l border-border/70 px-4 py-6 xl:block">
      <div className="sticky top-[5.5rem] grid gap-4">
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
            <div>
              <h2 className="text-sm font-bold">Pantauan cepat</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Kondisi Surabaya terkini</p>
            </div>
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px] shadow-emerald-500/10" />
          </div>
          <div className="grid p-2">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-secondary"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold">{item.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{item.caption}</span>
                </span>
                <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
            <h2 className="text-sm font-bold">Kategori isu</h2>
            <Link href="/map" className="text-[11px] font-semibold text-primary hover:underline">
              Semua
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            {CATEGORIES.map((category) => (
              <Link
                key={category.key}
                href={`/map?category=${category.key}`}
                className="flex min-w-0 items-center gap-2 rounded-xl bg-secondary/65 px-2.5 py-2 text-xs font-medium transition-colors hover:bg-secondary"
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full"
                  style={{ color: category.color, backgroundColor: `${category.color}18` }}
                >
                  <CategoryIcon icon={category.icon} className="size-3.5" />
                </span>
                <span className="truncate">{category.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold">Butuh jawaban cepat?</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Tanya kondisi wilayah berdasarkan laporan warga.
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/assistant"
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
            >
              <Bot className="size-3.5" /> Tanya AI
            </Link>
            <Link
              href="/feed"
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold"
            >
              <ArrowUpRight className="size-3.5" /> Buka feed
            </Link>
          </div>
          <Link href="/report" className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-primary">
            <Plus className="size-3.5" /> Buat laporan tanpa login
          </Link>
        </section>
      </div>
    </aside>
  )
}
