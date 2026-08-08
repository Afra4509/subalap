import type { CategoryKey } from "./types"

// Known Surabaya areas with approximate coordinates. Used to geo-locate a report
// when the browser geolocation is unavailable, and to place map markers.
export const SURABAYA_AREAS: Record<string, { lat: number; lng: number }> = {
  Wonokromo: { lat: -7.3009, lng: 112.7378 },
  Darmo: { lat: -7.2892, lng: 112.7411 },
  Keputih: { lat: -7.2925, lng: 112.8017 },
  Rungkut: { lat: -7.3358, lng: 112.7996 },
  Gayungan: { lat: -7.3235, lng: 112.7288 },
  Gubeng: { lat: -7.2654, lng: 112.7519 },
  Tegalsari: { lat: -7.2756, lng: 112.7395 },
  Sawahan: { lat: -7.2657, lng: 112.7231 },
  Genteng: { lat: -7.2568, lng: 112.7419 },
  Tambaksari: { lat: -7.2483, lng: 112.7623 },
  Mulyorejo: { lat: -7.2681, lng: 112.7907 },
  Sukolilo: { lat: -7.2942, lng: 112.7995 },
  Wiyung: { lat: -7.3213, lng: 112.6919 },
  Benowo: { lat: -7.2361, lng: 112.6273 },
  Kenjeran: { lat: -7.2286, lng: 112.7876 },
}

export const AREA_LIST = Object.keys(SURABAYA_AREAS)

export function findNearestArea(lat: number, lng: number) {
  return Object.entries(SURABAYA_AREAS).reduce(
    (nearest, [area, coords]) => {
      const latDistance = coords.lat - lat
      const lngDistance = (coords.lng - lng) * Math.cos((lat * Math.PI) / 180)
      const distance = latDistance * latDistance + lngDistance * lngDistance
      return distance < nearest.distance ? { area, distance } : nearest
    },
    { area: AREA_LIST[0], distance: Number.POSITIVE_INFINITY },
  ).area
}

const CATEGORY_KEYWORDS: Record<CategoryKey, string[]> = {
  banjir: ["banjir", "genangan", "air", "hujan", "luapan", "tergenang"],
  jalan_rusak: ["jalan", "lubang", "aspal", "berlubang", "rusak", "amblas"],
  sampah: ["sampah", "tps", "kotor", "bau", "menumpuk", "limbah"],
  lampu_jalan: ["lampu", "penerangan", "gelap", "pju", "mati"],
  kemacetan: ["macet", "kemacetan", "padat", "kendaraan", "lalu lintas", "antre"],
  lingkungan: ["pohon", "tumbang", "lingkungan", "polusi", "asap", "banjir rob"],
}

const CATEGORY_BASE_SEVERITY: Record<CategoryKey, number> = {
  banjir: 78,
  jalan_rusak: 62,
  sampah: 52,
  lampu_jalan: 48,
  kemacetan: 60,
  lingkungan: 55,
}

const HASHTAG_BASE: Record<CategoryKey, string> = {
  banjir: "Banjir",
  jalan_rusak: "JalanRusak",
  sampah: "Sampah",
  lampu_jalan: "LampuMati",
  kemacetan: "Macet",
  lingkungan: "Lingkungan",
}

const HIGH_IMPACT_TERMS = ["sekolah", "rumah sakit", "pasar", "kantor", "anak", "lansia", "terjebak", "parah", "darurat"]
const CRITICAL_TERMS = ["tidak bisa lewat", "putus total", "korban", "terjebak", "darurat", "sangat parah"]
const IMPROVING_TERMS = [
  "mulai surut",
  "mulai lancar",
  "sedang dibersihkan",
  "sedang diperbaiki",
  "petugas sudah datang",
  "dalam penanganan",
]
const RESOLVED_TERMS = [
  "sudah surut",
  "sudah bersih",
  "sudah dibersihkan",
  "sudah diperbaiki",
  "sudah menyala",
  "sudah lancar",
  "normal kembali",
  "sudah ditangani",
  "sudah selesai",
]

type ReportCondition = "active" | "improving" | "resolved"

interface AnalysisResult {
  category: CategoryKey
  condition: ReportCondition
  hashtags: string[]
  severity_score: number
  verification_score: number
  ai_summary: string
  recommended_action: string
  reasoning: string[]
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

const TOXICITY_DATASET = [
  "anjing", "babi", "bangsat", "kontol", "memek", "goblok", 
  "tolol", "jancok", "dancok", "asu", "asyu", "pantek", 
  "perek", "pelacur", "bajingan", "kampret", "taik", "tai"
]

export function isToxic(text: string): boolean {
  const lower = text.toLowerCase()
  return TOXICITY_DATASET.some(word => {
    // Regex to match exact word or word boundaries to avoid false positives
    const regex = new RegExp(`\\b${word}\\b`, 'i')
    return regex.test(lower)
  })
}

// Simulated AI pipeline: classification, hashtag generation, severity scoring,
// verification scoring, summarization, and toxicity check. Deterministic + light heuristics so
// demos stay stable while still feeling intelligent.
export function analyzeReport(input: {
  description: string
  category: CategoryKey
  area: string
  hasMedia: boolean
}): AnalysisResult {
  const text = input.description.toLowerCase()

  if (isToxic(text)) {
    throw new Error("Laporan Anda mengandung kata-kasar atau bahasa tidak pantas. Mohon gunakan bahasa yang baik.")
  }

  // 1. Classification — refine the user-selected category using keywords.
  let bestCategory = input.category
  let bestScore = 0
  for (const [key, words] of Object.entries(CATEGORY_KEYWORDS) as [CategoryKey, string[]][]) {
    const hits = words.filter((w) => text.includes(w)).length
    if (hits > bestScore) {
      bestScore = hits
      bestCategory = key
    }
  }
  const category = bestScore > 0 ? bestCategory : input.category

  // 2. Severity scoring.
  const condition: ReportCondition = RESOLVED_TERMS.some((term) => text.includes(term))
    ? "resolved"
    : IMPROVING_TERMS.some((term) => text.includes(term))
      ? "improving"
      : "active"
  let severity = CATEGORY_BASE_SEVERITY[category]
  const impactHits = HIGH_IMPACT_TERMS.filter((t) => text.includes(t))
  const criticalHits = CRITICAL_TERMS.filter((term) => text.includes(term))
  severity += impactHits.length * 6
  severity += criticalHits.length * 7
  if (text.length > 120) severity += 4
  if (condition === "improving") severity -= 16
  if (condition === "resolved") severity -= 36
  const reasoning: string[] = []
  if (impactHits.length > 0) reasoning.push(`Menyebut lokasi/objek sensitif (${impactHits.join(", ")})`)
  if (criticalHits.length > 0) reasoning.push(`Terdeteksi indikasi kritis (${criticalHits.join(", ")})`)
  if (condition === "improving") reasoning.push("Bahasa laporan menunjukkan kondisi sedang membaik")
  if (condition === "resolved") reasoning.push("Bahasa laporan menunjukkan kondisi telah pulih atau ditangani")
  reasoning.push(`Kategori ${HASHTAG_BASE[category]} memiliki bobot dampak dasar tinggi`)
  severity = clamp(severity)

  // 3. Verification scoring (anti-hoax heuristic).
  let verification = 70
  if (input.hasMedia) verification += 15
  if (text.length > 60) verification += 8
  if (input.area && SURABAYA_AREAS[input.area]) verification += 5
  verification = clamp(verification, 40, 98)
  if (input.hasMedia) reasoning.push("Terdapat foto pendukung")
  if (SURABAYA_AREAS[input.area]) reasoning.push("Lokasi cocok dengan wilayah Surabaya")

  // 4. Hashtag generation.
  const areaTag = input.area.replace(/\s+/g, "")
  const hashtags = [`${HASHTAG_BASE[category]}${areaTag}`, "Surabaya"]

  // 5. Summarization.
  const ai_summary = buildSummary(category, input.area, severity, condition)
  const recommended_action = buildRecommendedAction(condition, severity)

  return {
    category,
    condition,
    hashtags,
    severity_score: severity,
    verification_score: verification,
    ai_summary,
    recommended_action,
    reasoning,
  }
}

function buildSummary(
  category: CategoryKey,
  area: string,
  severity: number,
  condition: ReportCondition,
) {
  if (condition === "resolved") {
    return `Kondisi di ${area} dilaporkan telah pulih atau ditangani. Verifikasi lapangan tetap diperlukan sebelum insiden ditutup.`
  }
  if (condition === "improving") {
    return `Kondisi di ${area} menunjukkan perbaikan, tetapi dampak tersisa masih perlu dipantau dan diverifikasi.`
  }
  const level = severity >= 80 ? "berdampak besar" : severity >= 60 ? "cukup mengganggu" : "perlu perhatian"
  const map: Record<CategoryKey, string> = {
    banjir: `Laporan banjir di kawasan ${area} terdeteksi ${level} bagi mobilitas dan aktivitas warga.`,
    jalan_rusak: `Kerusakan jalan di ${area} dinilai ${level}, berisiko bagi pengendara.`,
    sampah: `Penumpukan sampah di ${area} ${level} terhadap kebersihan dan kesehatan lingkungan.`,
    lampu_jalan: `Lampu penerangan padam di ${area} ${level} bagi keamanan warga pada malam hari.`,
    kemacetan: `Kemacetan di ${area} ${level}, memperlambat arus lalu lintas.`,
    lingkungan: `Masalah lingkungan di ${area} ${level} bagi kenyamanan warga sekitar.`,
  }
  return map[category]
}

function buildRecommendedAction(condition: ReportCondition, severity: number) {
  if (condition === "resolved") return "Petugas perlu memverifikasi pemulihan sebelum menutup insiden."
  if (condition === "improving") return "Pantau ulang lokasi dan perbarui status setelah penanganan selesai."
  if (severity >= 80) return "Hindari lokasi bila memungkinkan dan prioritaskan eskalasi ke petugas terkait."
  if (severity >= 60) return "Jadwalkan pemeriksaan lapangan secepatnya dan pantau laporan tambahan."
  return "Validasi kondisi lapangan dan pantau perubahan dari laporan warga berikutnya."
}

// Impact Score formula (weighted, normalized 0-100):
// w1*reports + w2*affectedUsers + w3*severity + w4*engagement + w5*verification
export function computeImpactScore(params: {
  reportCount: number
  affectedUsers: number
  avgSeverity: number
  engagement: number
  avgVerification: number
}): number {
  const rNorm = Math.min(params.reportCount / 150, 1)
  const uNorm = Math.min(params.affectedUsers / 4000, 1)
  const sNorm = params.avgSeverity / 100
  const eNorm = Math.min(params.engagement / 3000, 1)
  const vNorm = params.avgVerification / 100
  const score = 0.3 * rNorm + 0.2 * uNorm + 0.25 * sNorm + 0.1 * eNorm + 0.15 * vNorm
  return clamp(score * 100)
}
