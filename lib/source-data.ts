import sourceDataset from "@/data asli/dataset_isu_surabaya_3_bulan_terverifikasi_2026-07-27.json"
import { isWithinSurabaya, SURABAYA_CENTER } from "./surabaya-geo"
import type {
  CategoryKey,
  Incident,
  IncidentLocation,
  PublicReport,
  ReportSource,
} from "./types"

interface SourceLocationPoint {
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  coordinate_precision: string
  estimated_accuracy_m: number | null
}

interface SourceVerification {
  status: string
  confidence: string
  notes: string
}

interface SourceRecord {
  id: string
  input_ids: string[]
  event_type: string
  category: string
  title: string
  date_start: string
  date_end: string
  time_local: string
  location_summary: string
  location_points: SourceLocationPoint[]
  description: string
  urgency: "Tinggi" | "Sedang" | "Rendah"
  verification: SourceVerification
  sources: ReportSource[]
}

interface SourceDataset {
  metadata: {
    title: string
    period_start: string
    period_end: string
    generated_date: string
    processing_summary: {
      input_rows_total: number
      duplicate_rows_removed: number
      canonical_records_in_output: number
      excluded_records_after_verification: number
    }
    content_counts: {
      location_points_total: number
      location_points_with_coordinates: number
    }
    method: string[]
    important_limitations: string[]
  }
  data: SourceRecord[]
  excluded_records: unknown[]
}

const dataset = sourceDataset as SourceDataset

const SEVERITY_MAP = {
  Tinggi: 86,
  Sedang: 62,
  Rendah: 38,
} as const

const STATUS_SCORE: Record<string, number> = {
  verified: 96,
  verified_with_correction: 92,
  verified_as_report_not_incident: 86,
  verified_field_report_only: 82,
  partially_verified: 76,
}

function resolveCategory(value: string): CategoryKey {
  const category = value.toLocaleLowerCase("id-ID")
  if (category.includes("banjir")) return "banjir"
  if (category.includes("kemacetan") || category.includes("parkir")) return "kemacetan"
  if (category.includes("listrik") || category.includes("traffic light")) return "lampu_jalan"
  if (category.includes("sampah")) return "sampah"
  if (category.includes("jalan rusak")) return "jalan_rusak"
  return "lingkungan"
}

function compactTag(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}

function toTimestamp(value: string) {
  return `${value}T00:00:00+07:00`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(toTimestamp(value)))
}

function formatDateRange(start: string, end: string) {
  return start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`
}

function verificationScore(record: SourceRecord) {
  const statusScore = STATUS_SCORE[record.verification.status] ?? 74
  const confidenceAdjustment =
    record.verification.confidence === "tinggi"
      ? 2
      : record.verification.confidence === "rendah"
        ? -5
        : 0
  return Math.max(0, Math.min(100, statusScore + confidenceAdjustment))
}

function validLocations(record: SourceRecord): IncidentLocation[] {
  return record.location_points.flatMap((point) => {
    if (point.latitude == null || point.longitude == null) return []
    return [
      {
        name: point.name,
        address: point.address,
        lat: point.latitude,
        lng: point.longitude,
        precision: point.coordinate_precision,
        accuracy_m: point.estimated_accuracy_m,
      },
    ]
  })
}

const publishers = new Set(
  dataset.data.flatMap((record) => record.sources.map((source) => source.publisher)),
)
const mappedLocations = dataset.data.flatMap(validLocations)

export const SOURCE_DATASET_METADATA = {
  judul: dataset.metadata.title,
  rentang_waktu: formatDateRange(dataset.metadata.period_start, dataset.metadata.period_end),
  sumber: `${publishers.size} penerbit dan sumber yang dapat ditelusuri`,
  catatan: dataset.metadata.important_limitations[0],
  generated_date: dataset.metadata.generated_date,
  input_rows: dataset.metadata.processing_summary.input_rows_total,
  duplicates_removed: dataset.metadata.processing_summary.duplicate_rows_removed,
  canonical_records: dataset.metadata.processing_summary.canonical_records_in_output,
  excluded_records: dataset.metadata.processing_summary.excluded_records_after_verification,
  location_points: dataset.metadata.content_counts.location_points_total,
  mapped_location_points: dataset.metadata.content_counts.location_points_with_coordinates,
  surabaya_location_points: mappedLocations.filter((location) =>
    isWithinSurabaya(location.lat, location.lng),
  ).length,
  publishers: publishers.size,
  method: dataset.metadata.method,
  limitations: dataset.metadata.important_limitations,
}

export const SOURCE_REPORTS: PublicReport[] = dataset.data
  .map((record, index) => {
    const category = resolveCategory(record.category)
    const locations = validLocations(record)
    const primaryLocation =
      locations.find((location) => isWithinSurabaya(location.lat, location.lng)) ??
      locations[0]
    const score = verificationScore(record)
    return {
      id: 900_001 + index,
      title: record.title,
      area: primaryLocation?.name ?? "Surabaya",
      category,
      description: record.description,
      media_url: null,
      hashtags: Array.from(
        new Set([
          compactTag(record.category),
          primaryLocation ? compactTag(primaryLocation.name) : "Surabaya",
          "Surabaya",
        ]),
      ),
      severity_score: SEVERITY_MAP[record.urgency],
      verification_score: score,
      ai_summary: null,
      ai_status: record.verification.status,
      incident_id: 800_001 + index,
      likes: 0,
      shares: 0,
      created_at: toTimestamp(record.date_start),
      origin: "integrated_source" as const,
      source_name: Array.from(new Set(record.sources.map((source) => source.publisher))).join(", "),
      source_record_id: record.id,
      event_date_label: formatDateRange(record.date_start, record.date_end),
      event_time: record.time_local || null,
      location_detail: record.location_summary,
      urgency_label: record.urgency,
      event_type: record.event_type,
      verification_status: record.verification.status,
      verification_confidence: record.verification.confidence,
      verification_notes: record.verification.notes,
      source_links: record.sources,
      location_points: locations,
    } satisfies PublicReport
  })
  .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))

export const SOURCE_INCIDENTS: Incident[] = dataset.data
  .map((record, index) => {
    const report = SOURCE_REPORTS.find((item) => item.source_record_id === record.id)!
    const locations = validLocations(record)
    const primaryLocation =
      locations.find((location) => isWithinSurabaya(location.lat, location.lng)) ??
      locations[0]
    return {
      id: 800_001 + index,
      title: record.title,
      hashtag: `${compactTag(record.category)}${
        primaryLocation ? compactTag(primaryLocation.name) : "Surabaya"
      }`,
      category: report.category,
      area: primaryLocation?.name ?? "Surabaya",
      lat: primaryLocation?.lat ?? SURABAYA_CENTER.lat,
      lng: primaryLocation?.lng ?? SURABAYA_CENTER.lng,
      report_count: Math.max(1, record.input_ids.length),
      affected_users: 0,
      avg_severity: report.severity_score,
      engagement: record.sources.length,
      avg_verification: report.verification_score,
      impact_score: Math.round(
        report.severity_score * 0.68 + report.verification_score * 0.32,
      ),
      status: "resolved",
      ai_summary: record.description,
      last_updated_at: toTimestamp(record.date_end),
      created_at: report.created_at,
      origin: "integrated_source" as const,
      location_points: locations,
    } satisfies Incident
  })
  .sort((a, b) => b.impact_score - a.impact_score)
