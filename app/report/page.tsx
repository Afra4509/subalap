import type { Metadata } from "next"
import { Camera, MapPin, ShieldCheck, Sparkles } from "lucide-react"
import { ReportForm } from "@/components/report-form"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Buat Laporan Warga",
  description: "Laporkan kondisi terbaru di Kota Surabaya dengan kamera, foto, lokasi, dan analisis awal.",
}

const STEPS = [
  { icon: Camera, title: "Ambil bukti", text: "Buka kamera langsung atau upload foto yang sudah ada." },
  { icon: MapPin, title: "Pastikan lokasi", text: "GPS di luar batas Kota Surabaya otomatis ditolak." },
  { icon: Sparkles, title: "Analisis keadaan", text: "Sistem membaca kondisi aktif, membaik, atau telah pulih." },
]

export default function ReportPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section>
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="size-4" /> Laporan Warga Surabaya
          </p>
          <h1 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Laporkan keadaan kota
          </h1>
          <p className="mb-6 mt-2 max-w-2xl text-muted-foreground">
            Form khusus wilayah Kota Surabaya. Tambahkan keadaan terbaru agar analisis dan prioritas penanganan lebih akurat.
          </p>
          <ReportForm />
        </section>

        <aside className="grid gap-4 lg:sticky lg:top-24">
          <Card className="border-primary/25 bg-primary/5 p-5">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold">Khusus Kota Surabaya</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Koordinat GPS diverifikasi pada browser dan server. Wilayah manual hanya area Surabaya.
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="font-display text-lg font-bold">Cara kerja</h2>
            <ol className="mt-4 grid gap-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <step.icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{index + 1}. {step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>
    </main>
  )
}
