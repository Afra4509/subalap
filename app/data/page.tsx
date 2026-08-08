import type { Metadata } from "next"
import Link from "next/link"
import {
  BookOpenCheck,
  CalendarDays,
  Database,
  FileCheck2,
  MapPin,
  ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CategoryIcon } from "@/components/category-icon"
import { DataFilterForm } from "@/components/data-filter-form"
import { getCategory, normalizeCategoryFilter } from "@/lib/categories"
import { SOURCE_DATASET_METADATA, SOURCE_REPORTS } from "@/lib/source-data"

export const metadata: Metadata = {
  title: "Data Isu Surabaya Terverifikasi",
  description: "Katalog laporan terintegrasi Surabaya dari sumber yang dapat ditelusuri.",
}

const URGENCY_STYLE = {
  Tinggi: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
  Sedang: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Rendah: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
} as const

export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; urgency?: string; q?: string }>
}) {
  const params = await searchParams
  const category = normalizeCategoryFilter(params.category)
  const urgency = ["Tinggi", "Sedang", "Rendah"].includes(params.urgency ?? "")
    ? params.urgency
    : "all"
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : ""
  const normalizedQuery = query.toLocaleLowerCase("id-ID")

  const records = SOURCE_REPORTS.filter((report) => {
    if (category !== "all" && report.category !== category) return false
    if (urgency !== "all" && report.urgency_label !== urgency) return false
    if (!normalizedQuery) return true
    return [
      report.title,
      report.description,
      report.area,
      report.location_detail,
      report.source_name,
      report.source_record_id,
    ]
      .join(" ")
      .toLocaleLowerCase("id-ID")
      .includes(normalizedQuery)
  })

  const highPriority = SOURCE_REPORTS.filter((report) => report.urgency_label === "Tinggi").length
  const sourceNames = new Set(
    SOURCE_REPORTS.flatMap(
      (report) => report.source_links?.map((source) => source.publisher) ?? [],
    ),
  )

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 pb-24 sm:px-6 sm:py-10 lg:pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Database className="size-4" /> Pusat Data SUBALAP
          </p>
          <h1 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Laporan terintegrasi, sumber terverifikasi
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Rekam isu tiga bulan terakhir sudah disaring, dideduplikasi, dan dilengkapi sumber
            yang dapat ditelusuri. Data menyatu dengan laporan warga di seluruh SUBALAP.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit gap-1.5">
          <ShieldCheck className="size-3.5" /> {SOURCE_DATASET_METADATA.rentang_waktu}
        </Badge>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total catatan", value: SOURCE_REPORTS.length, icon: FileCheck2 },
          { label: "Prioritas tinggi", value: highPriority, icon: ShieldCheck },
          { label: "Titik lokasi", value: SOURCE_DATASET_METADATA.location_points, icon: MapPin },
          { label: "Rujukan sumber", value: sourceNames.size, icon: BookOpenCheck },
        ].map((item) => (
          <Card key={item.label} className="p-4 sm:p-5">
            <item.icon className="size-5 text-primary" />
            <p className="mt-3 font-display text-2xl font-bold sm:text-3xl">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-5 border-primary/20 bg-primary/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <BookOpenCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">{SOURCE_DATASET_METADATA.judul}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {SOURCE_DATASET_METADATA.sumber}. Dari {SOURCE_DATASET_METADATA.input_rows} baris
              masukan, {SOURCE_DATASET_METADATA.duplicates_removed} duplikat dibuang dan{" "}
              {SOURCE_DATASET_METADATA.canonical_records} catatan kanonis diterbitkan.
            </p>
          </div>
        </div>
        <p className="mt-3 border-t border-primary/10 pt-3 text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Batas penggunaan:</strong>{" "}
          {SOURCE_DATASET_METADATA.catatan}
        </p>
      </Card>

      <DataFilterForm
        defaultQuery={query}
        defaultCategory={category}
        defaultUrgency={urgency}
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{records.length}</strong> catatan ditemukan
        </p>
        {(query || category !== "all" || urgency !== "all") && (
          <Button render={<Link href="/data" />} nativeButton={false} variant="ghost" size="sm">
            Hapus filter
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {records.map((report) => {
          const categoryMeta = getCategory(report.category)
          return (
            <Card key={report.id} className="flex h-full flex-col p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge
                  className="gap-1 border-0"
                  style={{
                    backgroundColor: `${categoryMeta.color}18`,
                    color: categoryMeta.color,
                  }}
                >
                  <CategoryIcon icon={categoryMeta.icon} className="size-3.5" />
                  {categoryMeta.label}
                </Badge>
                {report.urgency_label && (
                  <Badge variant="outline" className={URGENCY_STYLE[report.urgency_label]}>
                    {report.urgency_label}
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
                  Terverifikasi · {report.verification_confidence}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
                  {report.location_points?.length ?? 0} titik lokasi
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
                  {report.source_links?.length ?? 0} sumber
                </span>
              </div>

              <h2 className="mt-4 text-balance font-display text-lg font-bold leading-snug">
                {report.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {report.description}
              </p>

              <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {report.event_date_label}
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span className="line-clamp-2">{report.location_detail}</span>
                </p>
              </div>

              <div className="mt-auto flex items-end justify-between gap-4 border-t pt-4">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{report.source_name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-primary">
                    {report.source_record_id}
                  </p>
                </div>
                <Button
                  render={<Link href={`/feed#report-${report.id}`} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  Lihat feed
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {records.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Data tidak ditemukan. Coba kata kunci atau filter lain.
        </div>
      )}
    </main>
  )
}
