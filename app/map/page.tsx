import type { Metadata } from "next"
import { Map } from "lucide-react"
import { CityMap } from "@/components/city-map"
import { normalizeCategoryFilter } from "@/lib/categories"
import { getActiveIncidents } from "@/lib/data"
import { isDemoMode } from "@/lib/db"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Peta Kondisi Surabaya",
  description:
    "Peta OpenStreetMap interaktif untuk memantau laporan warga dan data sumber publik.",
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const activeCategory = normalizeCategoryFilter(category)
  const incidents = await getActiveIncidents()

  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-[1600px] flex-col overflow-hidden px-3 py-3 sm:px-4",
        isDemoMode
          ? "h-[calc(100dvh-10.6rem)] lg:h-[calc(100dvh-6.1rem)]"
          : "h-[calc(100dvh-8.5rem)] lg:h-[calc(100dvh-4rem)]",
      )}
    >
      <div className="flex shrink-0 items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium text-primary">
            <Map className="size-3.5" /> Peta Kondisi
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Kondisi Surabaya
          </h1>
        </div>
        <p className="hidden max-w-lg text-right text-xs text-muted-foreground md:block">
          Laporan terintegrasi dan laporan warga · dipetakan per wilayah
        </p>
      </div>

      <div className="mt-2 min-h-0 flex-1">
        {incidents.length > 0 ? (
          <CityMap
            initialIncidents={incidents}
            initialCategory={activeCategory}
            liveMode={!isDemoMode}
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            Belum ada laporan warga yang dapat dipetakan saat ini.
          </div>
        )}
      </div>
    </main>
  )
}
