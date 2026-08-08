"use client"

import { CATEGORIES } from "@/lib/categories"
import { cn } from "@/lib/utils"

export function FeedFilter({
  active,
  onChange,
}: {
  active: string
  onChange: (key: string) => void
}) {
  const items = [{ key: "all", label: "Semua" }, ...CATEGORIES.map((c) => ({ key: c.key, label: c.label }))]
  return (
    <div
      className="-mx-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      aria-label="Filter kategori laporan"
    >
      {items.map((item) => (
        <button
          type="button"
          key={item.key}
          onClick={() => onChange(item.key)}
          aria-pressed={active === item.key}
          className={cn(
            "min-h-9 shrink-0 snap-start rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
            active === item.key
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
