import type { Metadata } from "next"
import Link from "next/link"
import { BookOpenCheck, Database, ImagePlus, MapPin, Rss, Search, Sparkles } from "lucide-react"
import { FeedView } from "@/components/feed-view"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getPublicReports } from "@/lib/data"
import { normalizeCategoryFilter } from "@/lib/categories"
import { SOURCE_DATASET_METADATA } from "@/lib/source-data"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Feed Kondisi Surabaya",
  description: "Laporan warga dan data sumber publik Surabaya beserta kategori dan urgensi.",
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const { category, q } = await searchParams
  const activeCategory = normalizeCategoryFilter(category)
  const activeQuery = typeof q === "string" ? q.trim().slice(0, 100) : ""
  const reports = await getPublicReports()

  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-5 pb-24 sm:px-5 sm:py-7 lg:pb-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Rss className="h-4 w-4" /> Feed Kondisi Surabaya
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl">Kabar terbaru Surabaya</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Laporan warga dan data sumber publik tampil dalam satu alur dengan asal data yang jelas.
          </p>
        </div>
        <Button render={<Link href="/report" />} nativeButton={false} size="sm" className="hidden gap-2 sm:inline-flex">
          <Sparkles className="h-4 w-4" />
          Buat Laporan
        </Button>
      </div>

      <Card className="mt-5 p-4">
        <Link href="/report" className="group flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            W
          </span>
          <span className="flex min-h-11 flex-1 items-center rounded-full bg-secondary px-4 text-sm text-muted-foreground transition-colors group-hover:bg-secondary/80 group-hover:text-foreground">
            Apa yang terjadi di sekitar Anda?
          </span>
          <span className="hidden size-10 shrink-0 items-center justify-center rounded-xl text-primary sm:flex">
            <ImagePlus className="size-5" />
          </span>
        </Link>
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" /> Khusus wilayah Surabaya
          </span>
          <span className="font-semibold text-primary">Tanpa login</span>
        </div>
      </Card>

      <Card className="mt-4 border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpenCheck className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {SOURCE_DATASET_METADATA.canonical_records} laporan terintegrasi sudah masuk sistem
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {SOURCE_DATASET_METADATA.mapped_location_points} titik lokasi membawa tanggal,
              urgensi, status verifikasi, sumber, dan ID audit.
            </p>
          </div>
          <Button
            render={<Link href="/data" />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="hidden shrink-0 gap-1.5 sm:inline-flex"
          >
            <Database className="size-3.5" /> Pusat data
          </Button>
        </div>
      </Card>

      <form
        id="cari-laporan"
        action="/feed"
        method="get"
        role="search"
        className="relative mt-5 scroll-mt-24"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          name="q"
          defaultValue={activeQuery}
          aria-label="Cari laporan warga"
          placeholder="Cari laporan, wilayah, hashtag, atau kategori…"
          className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-24 text-sm shadow-sm outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
        />
        {activeCategory !== "all" && <input type="hidden" name="category" value={activeCategory} />}
        <Button type="submit" size="sm" className="absolute right-1.5 top-1.5">
          Cari
        </Button>
      </form>

      <div className="mt-5">
        <FeedView
          reports={reports}
          initialCategory={activeCategory}
          initialQuery={activeQuery}
        />
      </div>
    </main>
  )
}
