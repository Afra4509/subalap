import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Rss, Map, TrendingUp, Bot, LayoutDashboard, Sparkles } from "lucide-react"
import { BrandMark } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CategoryIcon } from "@/components/category-icon"
import { getCityStats, getTrending } from "@/lib/data"
import { CATEGORIES, getCategory } from "@/lib/categories"

export const dynamic = "force-dynamic"

const FEATURES = [
  { icon: Rss, title: "Feed Laporan Warga", desc: "Laporkan kondisi kota ala media sosial. AI membuat hashtag dan kategori otomatis.", href: "/feed" },
  { icon: Map, title: "Peta Kondisi Kota", desc: "Peta Surabaya real-time dengan marker per kategori dan tingkat urgensi.", href: "/map" },
  { icon: TrendingUp, title: "Isu Trending", desc: "Ranking isu kota berdasarkan Impact Score, bukan sekadar popularitas.", href: "/trending" },
  { icon: Bot, title: "Asisten Kota AI", desc: "Tanya kondisi wilayah berdasarkan laporan warga yang tersedia.", href: "/assistant" },
  { icon: LayoutDashboard, title: "Dashboard Kota", desc: "Statistik agregat wilayah dan rekomendasi prioritas penanganan.", href: "/dashboard" },
]

export default async function LandingPage() {
  const [stats, trending] = await Promise.all([getCityStats(), getTrending()])

  const statCards = [
    { label: "Total Catatan", value: stats.totalReports.toLocaleString("id-ID") },
    { label: "Catatan 24 Jam", value: stats.reportsToday.toLocaleString("id-ID") },
    { label: "Isu Terpantau", value: stats.totalIncidents.toLocaleString("id-ID") },
    { label: "Urgensi Rata-rata", value: `${stats.avgSeverity}/100` },
  ]

  return (
    <main className="pb-20 lg:pb-0">
      {/* Hero */}
      <section className="relative mx-3 my-4 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm sm:mx-5 sm:my-6">
        <div className="absolute inset-0">
          <Image
            src="/hero-surabaya.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1600px) 1028px, (min-width: 1280px) calc(100vw - 572px), (min-width: 1024px) calc(100vw - 272px), (min-width: 640px) calc(100vw - 40px), calc(100vw - 24px)"
            className="object-cover object-[58%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 via-55% to-card/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/35 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-5 gap-1.5 text-primary">
              <BrandMark className="size-4" />
              Dari warga · untuk warga
            </Badge>
            <h1 className="text-balance font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Suara Warga, <span className="text-primary">Kecerdasan Kota</span>
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              SUBALAP mengubah laporan warga Surabaya menjadi informasi kota yang mudah dipahami bersama.
              Kirim tanpa login, pantau perkembangan, dan bantu warga lain.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button render={<Link href="/report" />} nativeButton={false} size="lg" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Buat Laporan
              </Button>
              <Button
                render={<Link href="/map" />}
                nativeButton={false}
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                  Lihat Kondisi Kota
                  <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Live stats */}
          <div className="mt-10 grid grid-cols-2 gap-3 lg:max-w-3xl lg:grid-cols-4">
            {statCards.map((s) => (
              <Card key={s.label} className="border-border/60 bg-card/70 p-4 backdrop-blur">
                <p className="font-display text-2xl font-bold sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories strip */}
      <section className="mx-3 rounded-2xl border border-border/70 bg-card shadow-sm sm:mx-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 py-4 sm:gap-3 sm:px-6">
          <span className="mr-1 text-sm text-muted-foreground">Pantau kategori:</span>
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/map?category=${c.key}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary/50"
            >
              <CategoryIcon icon={c.icon} className="h-4 w-4" style={{ color: c.color }} />
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Satu platform, kecerdasan kota menyeluruh
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
              Laporan warga dan data sumber publik disatukan, lalu diringkas agar cepat dipahami dan ditindaklanjuti.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Link
              key={f.title}
              href={f.href}
              className={`group rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-primary/50 ${i >= 3 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            >
              <Card className="relative h-full overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 group-hover:border-primary/30">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-110">
                    <f.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all sm:translate-x-[-10px] sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
                    Buka <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending preview */}
      <section className="relative border-y border-border/60 bg-gradient-to-b from-secondary/30 to-background overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 relative z-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Trending Surabaya</h2>
              <p className="mt-2 text-sm text-muted-foreground">Isu paling berdampak berdasarkan Impact Score.</p>
            </div>
            <Button
              render={<Link href="/trending" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full shadow-sm hover:shadow-md transition-shadow"
            >
                Semua <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trending.slice(0, 6).map((inc, i) => {
              const cat = getCategory(inc.category)
              return (
                <Link key={inc.id} href={`/trending#incident-${inc.id}`} className="group outline-none">
                  <Card className="relative flex flex-col items-center justify-center gap-3 overflow-hidden p-8 text-center transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/10 group-hover:border-primary/40 group-focus-visible:ring-3 group-focus-visible:ring-primary/50">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-primary/[0.05] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    
                    {/* Large Background Number */}
                    <div className="absolute -top-4 -right-2 font-display text-[120px] font-black leading-none text-muted-foreground/[0.03] transition-transform duration-500 group-hover:scale-110 group-hover:text-primary/[0.05] pointer-events-none select-none">
                      {i + 1}
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <span className="flex size-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/50 font-display text-xl font-bold text-muted-foreground transition-colors group-hover:text-primary group-hover:ring-primary/30">
                        {i + 1}
                      </span>
                      
                      <div>
                        <p className="line-clamp-2 font-display text-lg font-bold text-primary transition-all group-hover:underline decoration-primary/30 underline-offset-4">
                          #{inc.hashtag}
                        </p>
                        <div className="mt-3 flex flex-wrap justify-center items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-secondary/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                            {inc.report_count} catatan
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset" style={{ color: cat.color, backgroundColor: `${cat.color}10`, borderColor: `${cat.color}25` }}>
                            <CategoryIcon icon={cat.icon} className="size-3.5" />
                            {cat.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 mt-2 text-center pt-4 w-full border-t border-border/40">
                      <p className="font-display text-4xl font-black drop-shadow-sm transition-transform duration-500 group-hover:scale-110" style={{ color: cat.color }}>
                        {inc.impact_score}
                      </p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Impact</p>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-primary/30 via-primary/10 to-transparent shadow-2xl shadow-primary/10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/10 blur-xl" />
          <Card className="relative overflow-hidden border-none bg-card/90 backdrop-blur-xl p-10 text-center sm:p-16">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 size-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 size-64 rounded-full bg-blue-500/10 blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-balance font-display text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-b from-foreground to-foreground/80 bg-clip-text text-transparent">
                Lihat sesuatu? Laporkan sekarang.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
                Tanpa login. Identitas tidak tampil di publik. Laporan Anda membantu seluruh warga Surabaya.
              </p>
              <div className="mt-10 flex justify-center">
                <Button render={<Link href="/report" />} nativeButton={false} size="lg" className="h-14 gap-2 rounded-2xl px-8 text-base shadow-xl shadow-primary/25 transition-all hover:scale-105 hover:shadow-primary/40 active:scale-95">
                  <Sparkles className="size-5" />
                  Buat Laporan Warga
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

    </main>
  )
}
