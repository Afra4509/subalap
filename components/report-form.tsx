"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImageUp,
  Loader2,
  LocateFixed,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import { createReport } from "@/app/actions/reports"
import { SeverityMeter } from "@/components/severity-meter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AREA_LIST, findNearestArea } from "@/lib/ai-analysis"
import { CATEGORIES } from "@/lib/categories"
import { isWithinSurabaya } from "@/lib/surabaya-geo"
import type { CategoryKey, PublicReport } from "@/lib/types"
import { toast } from "sonner"

type Step = "form" | "processing" | "result"
type ReportResult = Awaited<ReturnType<typeof createReport>>

const CONDITION_META = {
  active: { label: "Masih aktif", className: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-300" },
  improving: { label: "Mulai membaik", className: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  resolved: { label: "Dilaporkan pulih", className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
} as const

const LOCAL_REPORTS_KEY = "subalap-local-reports"

function saveLocalReport(report: PublicReport) {
  const current = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) ?? "[]") as PublicReport[]
  localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify([report, ...current].slice(0, 6)))
}

async function optimizeImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Gunakan foto JPG, PNG, atau WebP.")
  }
  if (file.size > 8 * 1024 * 1024) throw new Error("Ukuran foto maksimal 8 MB.")

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Foto gagal dibaca."))
    reader.readAsDataURL(file)
  })
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new window.Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error("Format foto tidak dapat dibaca."))
    element.src = source
  })

  const maxDimension = 1200
  const ratio = Math.min(maxDimension / Math.max(image.width, image.height), 1)
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(image.width * ratio))
  canvas.height = Math.max(1, Math.round(image.height * ratio))
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Foto gagal diproses.")
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const encode = (quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Foto gagal dikompresi."))
      }, "image/webp", quality)
    })

  let blob = await encode(0.76)
  if (blob.size > 520_000) blob = await encode(0.54)
  if (blob.size > 520_000) throw new Error("Foto masih terlalu besar. Pilih foto lain.")

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Foto gagal diproses."))
    reader.readAsDataURL(blob)
  })
}

export function ReportForm() {
  const router = useRouter()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const submitLockRef = useRef(false)
  const [step, setStep] = useState<Step>("form")
  const [mediaDataUrl, setMediaDataUrl] = useState<string | null>(null)
  const [mediaName, setMediaName] = useState("")
  const [mediaBusy, setMediaBusy] = useState(false)
  const [locating, setLocating] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [result, setResult] = useState<ReportResult | null>(null)
  const [formError, setFormError] = useState("")
  const [localSaveFailed, setLocalSaveFailed] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    area: "",
    category: "" as CategoryKey | "",
    description: "",
  })

  function clearFileInputs() {
    if (cameraInputRef.current) cameraInputRef.current.value = ""
    if (uploadInputRef.current) uploadInputRef.current.value = ""
  }

  async function handleMedia(file?: File) {
    if (!file) return
    setMediaBusy(true)
    try {
      setMediaDataUrl(await optimizeImage(file))
      setMediaName(file.name || "Foto kamera")
      toast.success("Foto siap dilampirkan.")
    } catch (error) {
      setMediaDataUrl(null)
      setMediaName("")
      clearFileInputs()
      toast.error(error instanceof Error ? error.message : "Foto gagal diproses.")
    } finally {
      setMediaBusy(false)
    }
  }

  function removeMedia() {
    setMediaDataUrl(null)
    setMediaName("")
    clearFileInputs()
  }

  function locateUser() {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung lokasi perangkat.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setLocating(false)
        if (!isWithinSurabaya(coords.lat, coords.lng)) {
          setLocation(null)
          toast.error("Lokasi di luar Kota Surabaya. Laporan tidak dapat dikirim.")
          return
        }
        const area = findNearestArea(coords.lat, coords.lng)
        setLocation(coords)
        setForm((current) => ({ ...current, area }))
        toast.success(`Lokasi valid di Surabaya, dekat ${area}.`)
      },
      () => {
        setLocating(false)
        toast.error("Lokasi gagal dibaca. Izinkan akses lokasi lalu coba lagi.")
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submitLockRef.current) return
    if (!form.name || !form.email || !form.area || !form.category || !form.description) {
      const message = "Lengkapi semua kolom wajib sebelum mengirim laporan."
      setFormError(message)
      toast.error(message)
      const missingCustomField = !form.area
        ? document.getElementById("report-area")
        : !form.category
          ? document.getElementById("report-category")
          : null
      requestAnimationFrame(() => missingCustomField?.focus())
      return
    }
    if (location && !isWithinSurabaya(location.lat, location.lng)) {
      toast.error("Lokasi GPS harus berada di Kota Surabaya.")
      return
    }

    submitLockRef.current = true
    setFormError("")
    setLocalSaveFailed(false)
    setStep("processing")
    try {
      const response = await createReport({
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp || undefined,
        area: form.area,
        category: form.category as CategoryKey,
        description: form.description,
        mediaUrl: mediaDataUrl,
        lat: location?.lat,
        lng: location?.lng,
      })
      if (!response.persisted) {
        try {
          saveLocalReport({
            id: response.reportId,
            area: form.area,
            category: response.analysis.category,
            description: form.description.trim(),
            media_url: mediaDataUrl,
            hashtags: response.analysis.hashtags,
            severity_score: response.analysis.severity_score,
            verification_score: response.analysis.verification_score,
            ai_summary: response.analysis.ai_summary,
            ai_status: "local_only",
            incident_id: null,
            likes: 0,
            shares: 0,
            created_at: new Date().toISOString(),
            origin: "local_citizen",
          })
        } catch {
          setLocalSaveFailed(true)
          toast.warning("Laporan dianalisis, tetapi penyimpanan lokal perangkat penuh.")
        }
      }
      setResult(response)
      setStep("result")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Laporan gagal dikirim."
      setFormError(message)
      toast.error(message)
      setStep("form")
    } finally {
      submitLockRef.current = false
    }
  }

  function reset() {
    setStep("form")
    setResult(null)
    setMediaDataUrl(null)
    setMediaName("")
    setLocation(null)
    setFormError("")
    setLocalSaveFailed(false)
    clearFileInputs()
    setForm({ name: "", email: "", whatsapp: "", area: "", category: "", description: "" })
  }

  if (step === "processing") {
    return (
      <Card className="flex min-h-[460px] flex-col items-center justify-center gap-5 p-8 text-center" aria-live="polite">
        <div className="relative">
          <Loader2 className="size-14 animate-spin text-primary" />
          <Sparkles className="absolute inset-0 m-auto size-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Menganalisis keadaan…</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Membaca kategori, kondisi terbaru, urgensi, dan kelengkapan bukti.
          </p>
        </div>
      </Card>
    )
  }

  if (step === "result" && result) {
    const condition = CONDITION_META[result.analysis.condition]
    return (
      <Card className="p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600">
            <CheckCircle2 className="size-6" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold">Laporan terkirim</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.persisted
                ? "Tersimpan di sistem dan dipublikasikan anonim. Hasil AI tetap perlu verifikasi petugas."
                : localSaveFailed
                  ? "Analisis selesai, tetapi penyimpanan perangkat penuh. Salin hasil penting sebelum meninggalkan halaman."
                  : "Tersimpan di perangkat ini dan langsung tampil di feed lokal. Hubungkan database untuk sinkronisasi publik."}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="outline" className={condition.className}>{condition.label}</Badge>
          {result.analysis.hashtags.map((hashtag) => (
            <Badge key={hashtag} variant="secondary" className="text-primary">#{hashtag}</Badge>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SeverityMeter score={result.analysis.severity_score} />
          <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-4 text-sm">
            <ShieldCheck className="size-5 text-primary" />
            <span>Skor kelengkapan <strong>{result.analysis.verification_score}%</strong></span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-4">
            <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="size-4" /> Ringkasan AI
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{result.analysis.ai_summary}</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="mb-1.5 text-xs font-semibold text-primary">Tindakan disarankan</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{result.analysis.recommended_action}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border p-4">
          <p className="mb-2 text-xs font-semibold">Dasar analisis</p>
          <ul className="grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
            {result.analysis.reasoning.map((reason) => (
              <li key={reason} className="flex gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {!localSaveFailed && (
            <Button render={<Link href={`/feed#report-${result.reportId}`} />} nativeButton={false} className="sm:flex-1">
              Lihat di feed
            </Button>
          )}
          <Button type="button" variant="outline" onClick={reset} className="sm:flex-1">
            Buat laporan lain
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5 sm:p-7">
      <form onSubmit={handleSubmit} className="grid gap-5">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {formError}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="report-name">Nama *</Label>
            <Input
              id="report-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Nama Anda"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="report-email">Email *</Label>
            <Input
              id="report-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="email@contoh.com"
              autoComplete="email"
              maxLength={160}
              required
            />
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">
                {location ? "Lokasi GPS valid di Surabaya" : "Validasi lokasi Surabaya"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {location
                  ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)} · ${form.area}`
                  : "GPS di luar batas kota otomatis ditolak. Wilayah manual hanya Surabaya."}
              </p>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={locateUser} disabled={locating}>
            {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
            {locating ? "Mencari…" : "Gunakan GPS"}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="report-area">Wilayah Surabaya *</Label>
            <Select
              value={form.area}
              onValueChange={(value) => {
                setForm({ ...form, area: value ?? "" })
                setFormError("")
              }}
            >
              <SelectTrigger id="report-area" className="w-full" aria-invalid={Boolean(formError && !form.area)}>
                <SelectValue placeholder="Pilih wilayah" />
              </SelectTrigger>
              <SelectContent>
                {AREA_LIST.map((area) => <SelectItem key={area} value={area}>{area}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="report-category">Kategori *</Label>
            <Select
              value={form.category}
              onValueChange={(value) => {
                setForm({ ...form, category: (value ?? "") as CategoryKey | "" })
                setFormError("")
              }}
            >
              <SelectTrigger
                id="report-category"
                className="w-full"
                aria-invalid={Boolean(formError && !form.category)}
              >
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.key} value={category.key}>{category.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="report-description">Deskripsi keadaan *</Label>
          <Textarea
            id="report-description"
            rows={5}
            minLength={10}
            maxLength={1500}
            required
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Contoh: Jalan depan sekolah masih banjir dan motor tidak bisa lewat. Atau: air sudah mulai surut setelah petugas datang."
          />
          <span className="text-right text-[11px] text-muted-foreground">{form.description.length}/1500</span>
        </div>

        <div className="grid gap-1.5">
          <Label>Foto kejadian (disarankan)</Label>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => void handleMedia(event.target.files?.[0])}
          />
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => void handleMedia(event.target.files?.[0])}
          />
          {mediaDataUrl ? (
            <div className="overflow-hidden rounded-xl border bg-secondary/30">
              <div className="relative aspect-[16/7] min-h-44 bg-secondary">
                <img src={mediaDataUrl} alt="Pratinjau foto laporan" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute right-2 top-2 flex size-10 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur"
                  aria-label="Hapus foto"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="truncate px-3 py-2 text-xs text-muted-foreground">{mediaName}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-20 flex-col gap-1.5"
                onClick={() => cameraInputRef.current?.click()}
                disabled={mediaBusy}
              >
                {mediaBusy ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5 text-primary" />}
                <span>Ambil foto</span>
                <span className="text-[11px] font-normal text-muted-foreground">Buka kamera</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-20 flex-col gap-1.5"
                onClick={() => uploadInputRef.current?.click()}
                disabled={mediaBusy}
              >
                {mediaBusy ? <Loader2 className="size-5 animate-spin" /> : <ImageUp className="size-5 text-primary" />}
                <span>Upload foto</span>
                <span className="text-[11px] font-normal text-muted-foreground">Galeri atau file</span>
              </Button>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP · maksimal 8 MB · otomatis dikompresi.</p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="report-whatsapp">WhatsApp (opsional)</Label>
          <Input
            id="report-whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={24}
            value={form.whatsapp}
            onChange={(event) => setForm({ ...form, whatsapp: event.target.value })}
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          Identitas dan kontak tidak tampil publik. Jangan mengirim foto yang membuka data pribadi orang lain.
        </div>

        <Button type="submit" size="lg" className="w-full gap-2" disabled={mediaBusy}>
          <Sparkles className="size-4" />
          Kirim dan analisis keadaan
        </Button>
      </form>
    </Card>
  )
}
