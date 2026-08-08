import type { Metadata } from "next"
import Link from "next/link"
import { Activity, ArrowRight, CheckCircle2, Gauge, LayoutDashboard, Radio, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCategory, STATUS_META } from "@/lib/categories"
import { getCityStats, getIncidents } from "@/lib/data"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Dashboard Kota",
  description: "Ringkasan laporan, insiden, dampak, dan prioritas penanganan Surabaya.",
}

export default async function DashboardPage() {
  const [stats, incidents] = await Promise.all([getCityStats(), getIncidents()])
  const cards = [
    { label: "Total catatan", value: stats.totalReports, icon: Radio, gradient: "from-blue-500/10 to-transparent", iconColor: "text-blue-500" },
    { label: "Isu terpantau", value: stats.totalIncidents, icon: Activity, gradient: "from-indigo-500/10 to-transparent", iconColor: "text-indigo-500" },
    { label: "Rekam historis", value: stats.resolvedIncidents, icon: CheckCircle2, gradient: "from-emerald-500/10 to-transparent", iconColor: "text-emerald-500" },
    { label: "Urgensi rata-rata", value: `${stats.avgSeverity}/100`, icon: Gauge, gradient: "from-rose-500/10 to-transparent", iconColor: "text-rose-500" },
  ]
  const maxCategory = Math.max(...stats.byCategory.map((item) => item.count), 1)
  const priority =
    incidents.find(
      (incident) =>
        incident.origin !== "integrated_source" && incident.status !== "resolved",
    ) ?? incidents[0]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <LayoutDashboard className="h-4 w-4" /> Dashboard Kota
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Ringkasan kondisi kota
          </h1>
          <p className="mt-2 text-muted-foreground">Ringkasan insiden dan prioritas penanganan Surabaya.</p>
        </div>
        <Badge variant="secondary" className="shadow-sm">Data saat ini</Badge>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.label} className={`relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 group`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-50 transition-opacity group-hover:opacity-100`} />
            <div className="relative z-10">
              <span className={`inline-flex size-10 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/50 ${item.iconColor}`}>
                <item.icon className="size-5" />
              </span>
              <p className="mt-5 font-display text-3xl font-bold sm:text-4xl tracking-tight">
                {typeof item.value === "number" ? item.value.toLocaleString("id-ID") : item.value}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="p-6 shadow-md shadow-primary/5 transition-all hover:shadow-lg">
          <h2 className="font-display text-lg font-bold">Laporan per kategori</h2>
          <div className="mt-6 space-y-5">
            {stats.byCategory.map((item) => {
              const category = getCategory(item.category)
              return (
                <div key={item.category} className="group">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">{category.label}</span>
                    <span className="font-bold">{item.count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-secondary/60">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      role="progressbar"
                      aria-label={`${category.label}: ${item.count} laporan`}
                      aria-valuenow={item.count}
                      aria-valuemin={0}
                      aria-valuemax={maxCategory}
                      style={{ 
                        width: `${(item.count / maxCategory) * 100}%`, 
                        backgroundColor: category.color,
                        boxShadow: `0 0 12px ${category.color}80`
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="overflow-hidden p-0 shadow-md shadow-primary/5 transition-all hover:shadow-lg flex flex-col">
          <div className="border-b px-6 py-5 bg-secondary/20">
            <h2 className="font-display text-lg font-bold">Prioritas insiden</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full min-w-[650px] text-sm">
              <caption className="sr-only">
                Daftar insiden berdasarkan prioritas dampak
              </caption>
              <thead className="bg-secondary/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-4">Insiden</th>
                  <th scope="col" className="px-6 py-4">Wilayah</th>
                  <th scope="col" className="px-6 py-4">Catatan</th>
                  <th scope="col" className="px-6 py-4">Impact</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="transition-colors hover:bg-secondary/30 group">
                    <td className="px-6 py-4 font-semibold text-foreground group-hover:text-primary transition-colors">#{incident.hashtag}</td>
                    <td className="px-6 py-4 text-muted-foreground">{incident.area}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex size-6 items-center justify-center rounded-md bg-secondary text-xs font-bold">{incident.report_count}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground">{incident.impact_score}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: incident.origin === "integrated_source" ? "#22c55e15" : `${STATUS_META[incident.status].color}15`,
                          color: incident.origin === "integrated_source" ? "#22c55e" : STATUS_META[incident.status].color,
                        }}
                      >
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
                        {incident.origin === "integrated_source"
                          ? "Terverifikasi"
                          : STATUS_META[incident.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-[1px]">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/0 to-transparent blur-xl" />
        <Card className="relative h-full w-full border-none bg-card/80 p-6 backdrop-blur-xl sm:p-8 shadow-2xl shadow-primary/10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex max-w-3xl gap-4">
              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30">
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
                <Sparkles className="size-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Rekomendasi prioritas AI
                </p>
                <h2 className="mt-1.5 font-display text-xl font-extrabold sm:text-2xl">
                  {priority
                    ? `Tinjau isu prioritas di ${priority.area}`
                    : "Belum ada isu terpantau"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground/90 max-w-2xl">
                  {priority
                    ? `${priority.title} memiliki Impact Score yang tinggi (${priority.impact_score}/100). Buka peta untuk meninjau lokasi secara spesifik, memeriksa sumber pendukung, dan merencanakan penanganan dengan cepat.`
                    : "Data akan tampil setelah laporan atau sumber terverifikasi masuk. Tetap pantau untuk pembaruan."}
                </p>
              </div>
            </div>
            {priority && (
              <Button render={<Link href={`/map?category=${priority.category}`} />} nativeButton={false} size="lg" className="shrink-0 gap-2 rounded-xl text-sm shadow-xl shadow-primary/25">
                Buka Peta Evaluasi
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </main>
  )
}

