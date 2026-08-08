"use client"

import { Search } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CATEGORIES } from "@/lib/categories"

export function DataFilterForm({
  defaultQuery = "",
  defaultCategory = "all",
  defaultUrgency = "all",
}: {
  defaultQuery?: string
  defaultCategory?: string
  defaultUrgency?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLiveSearch = (form: HTMLFormElement) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      const formData = new FormData(form)
      const q = formData.get("q")?.toString() || ""
      const category = formData.get("category")?.toString() || "all"
      const urgency = formData.get("urgency")?.toString() || "all"

      const params = new URLSearchParams(searchParams.toString())
      if (q) params.set("q", q)
      else params.delete("q")
      
      if (category && category !== "all") params.set("category", category)
      else params.delete("category")

      if (urgency && urgency !== "all") params.set("urgency", urgency)
      else params.delete("urgency")

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    }, 300)
  }

  return (
    <form 
      className="mt-6 grid gap-3 rounded-2xl border bg-card p-3 shadow-sm sm:grid-cols-[1fr_190px_160px_auto] transition-all hover:shadow-md"
      onChange={(e) => handleLiveSearch(e.currentTarget)}
      onSubmit={(e) => {
         e.preventDefault()
         handleLiveSearch(e.currentTarget)
      }}
    >
      <label className="relative">
        <span className="sr-only">Cari data</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder="Cari judul, lokasi, sumber, atau ID…"
          className="h-11 w-full rounded-xl border border-border/70 bg-secondary/55 pl-10 pr-3 text-sm outline-none transition focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10"
        />
      </label>
      <select
        name="category"
        defaultValue={defaultCategory}
        aria-label="Filter kategori"
        className="h-11 rounded-xl border border-border/70 bg-secondary/55 px-3 text-sm outline-none transition focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10"
      >
        <option value="all">Semua kategori</option>
        {CATEGORIES.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
          </option>
        ))}
      </select>
      <select
        name="urgency"
        defaultValue={defaultUrgency}
        aria-label="Filter urgensi"
        className="h-11 rounded-xl border border-border/70 bg-secondary/55 px-3 text-sm outline-none transition focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10"
      >
        <option value="all">Semua urgensi</option>
        <option value="Tinggi">Tinggi</option>
        <option value="Sedang">Sedang</option>
        <option value="Rendah">Rendah</option>
      </select>
      <Button type="submit" className="h-11" disabled={isPending}>
        {isPending ? "Mencari..." : "Terapkan"}
      </Button>
    </form>
  )
}
