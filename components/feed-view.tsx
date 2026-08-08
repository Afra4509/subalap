"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FeedFilter } from "@/components/feed-filter"
import { ReportCard } from "@/components/report-card"
import { getCategory } from "@/lib/categories"
import type { PublicReport } from "@/lib/types"

export function FeedView({
  reports,
  initialCategory = "all",
  initialQuery = "",
}: {
  reports: PublicReport[]
  initialCategory?: string
  initialQuery?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [category, setCategory] = useState(initialCategory)
  const [localReports, setLocalReports] = useState<PublicReport[]>([])
  const normalizedQuery = initialQuery.trim().toLocaleLowerCase("id-ID")
  const allReports = useMemo(
    () => [...localReports, ...reports],
    [localReports, reports],
  )
  const filtered = useMemo(() => {
    const byCategory =
      category === "all"
        ? allReports
        : allReports.filter((report) => report.category === category)
    if (!normalizedQuery) return byCategory

    return byCategory.filter((report) => {
      const categoryMeta = getCategory(report.category)
      const searchable = [
        report.description,
        report.title,
        report.area,
        report.location_detail,
        report.source_name,
        report.source_record_id,
        report.category,
        categoryMeta.label,
        ...report.hashtags,
      ]
        .join(" ")
        .toLocaleLowerCase("id-ID")
      return searchable.includes(normalizedQuery)
    })
  }, [allReports, category, normalizedQuery])

  useEffect(() => {
    setCategory(initialCategory)
  }, [initialCategory])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("subalap-local-reports") ?? "[]")
      if (Array.isArray(stored)) {
        setLocalReports(stored as PublicReport[])
      }
    } catch {
      localStorage.removeItem("subalap-local-reports")
    }
  }, [])

  useEffect(() => {
    if (!window.location.hash.startsWith("#report-")) return
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(window.location.hash.slice(1))
        ?.scrollIntoView({ block: "start" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [localReports])

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory)
    const params = new URLSearchParams(searchParams.toString())
    if (nextCategory === "all") params.delete("category")
    else params.set("category", nextCategory)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <>
      <FeedFilter active={category} onChange={selectCategory} />
      {initialQuery && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2 text-sm">
          <p>
            <span className="font-semibold">{filtered.length}</span> hasil untuk{" "}
            <span className="font-semibold text-primary">“{initialQuery}”</span>
          </p>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.delete("q")
              const query = params.toString()
              router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
            }}
            className="min-h-9 rounded-lg px-3 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            Hapus pencarian
          </button>
        </div>
      )}
      <div className="mt-5 grid gap-5">
        {filtered.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {initialQuery
            ? "Belum ada laporan warga yang cocok dengan pencarian ini."
            : "Belum ada laporan pada kategori ini."}
        </div>
      )}
    </>
  )
}
