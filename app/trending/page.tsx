import type { Metadata } from "next"
import { Flame, MapPin, MessagesSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CategoryIcon } from "@/components/category-icon"
import { getCategory, STATUS_META } from "@/lib/categories"
import { getTrending } from "@/lib/data"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Trending Surabaya",
  description: "Ranking isu Surabaya terintegrasi berdasarkan Impact Score.",
}

export default async function TrendingPage() {
  const incidents = await getTrending()

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <p className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Flame className="h-5 w-5" /> Peringkat Dampak
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Trending Surabaya</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground leading-relaxed">
        Urutan isu dari laporan warga dan sumber terverifikasi berdasarkan urgensi serta kelengkapan data.
      </p>

      <div className="mt-10 space-y-5">
        {incidents.map((incident, index) => {
          const category = getCategory(incident.category)
          const isTop3 = index < 3
          return (
            <Card
              id={`incident-${incident.id}`}
              key={incident.id}
              className={`group relative scroll-mt-24 overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isTop3 ? 'border-primary/30 shadow-md shadow-primary/5' : 'border-border/60 hover:border-primary/40'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
                <span className={`font-display text-5xl font-black drop-shadow-sm transition-colors duration-300 ${
                  isTop3 ? 'text-primary/30 group-hover:text-primary/50' : 'text-muted-foreground/20 group-hover:text-muted-foreground/40'
                }`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner ring-1 ring-inset ring-white/10"
                  style={{ color: category.color, backgroundColor: `${category.color}15` }}
                >
                  <CategoryIcon icon={category.icon} className="h-7 w-7 drop-shadow-md" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-bold group-hover:text-primary transition-colors">#{incident.hashtag}</h2>
                    <Badge variant="secondary" className="shadow-sm">{category.label}</Badge>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ring-1 ring-inset"
                      style={{
                        backgroundColor: incident.origin === "integrated_source" ? "#22c55e15" : `${STATUS_META[incident.status].color}15`,
                        color: incident.origin === "integrated_source" ? "#22c55e" : STATUS_META[incident.status].color,
                        borderColor: incident.origin === "integrated_source" ? "#22c55e30" : `${STATUS_META[incident.status].color}30`,
                      }}
                    >
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
                      {incident.origin === "integrated_source"
                        ? "Terverifikasi"
                        : STATUS_META[incident.status].label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{incident.ai_summary}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {incident.area}
                    </span>
                    <span className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1">
                      <MessagesSquare className="h-3.5 w-3.5 text-primary" /> {incident.report_count} catatan
                    </span>
                    <span className="flex items-center px-1">
                      {incident.affected_users > 0
                        ? <><strong className="mr-1 text-foreground">{incident.affected_users.toLocaleString("id-ID")}</strong> warga terdampak</>
                        : "Dampak warga belum tersedia"}
                    </span>
                  </div>
                </div>
                
                <div className="min-w-[100px] text-left sm:text-right">
                  <p className="font-display text-4xl font-black drop-shadow-md transition-transform duration-300 group-hover:scale-110" style={{ color: category.color }}>
                    {incident.impact_score}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Impact Score</p>
                </div>
              </div>
            </Card>
          )
        })}
        {incidents.length === 0 && (
          <Card className="items-center border-dashed border-2 bg-secondary/20 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Flame className="size-8" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold">Belum ada isu aktif</h2>
            <p className="mt-2 text-muted-foreground">
              Ranking akan muncul setelah laporan warga terverifikasi.
            </p>
          </Card>
        )}
      </div>
    </main>
  )
}
