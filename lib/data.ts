import "server-only"
import { supabase } from "./db"
import type { CategoryKey, Comment, Incident, PublicReport } from "./types"
import { isWithinSurabaya } from "./surabaya-geo"
import { SOURCE_INCIDENTS, SOURCE_REPORTS } from "./source-data"
import fs from "fs"
import path from "path"

const DELETED_FILE = path.join(process.cwd(), "deleted-reports.json")

export function archiveSourceReport(id: number) {
  let deleted: number[] = []
  try {
    if (fs.existsSync(DELETED_FILE)) {
      deleted = JSON.parse(fs.readFileSync(DELETED_FILE, "utf-8"))
    }
  } catch (e) {}
  
  if (!deleted.includes(id)) {
    deleted.push(id)
    fs.writeFileSync(DELETED_FILE, JSON.stringify(deleted))
  }
}

function getArchivedSourceReports() {
  try {
    if (fs.existsSync(DELETED_FILE)) {
      return new Set<number>(JSON.parse(fs.readFileSync(DELETED_FILE, "utf-8")))
    }
  } catch (e) {}
  return new Set<number>()
}

function newestFirst<T extends { created_at: string }>(items: T[]) {
  return items.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
}



function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) || 1
}

// Map a Supabase report row to our PublicReport shape
function mapSupabaseReport(row: Record<string, unknown>): PublicReport {
  return {
    id: typeof row.id === "string" ? hashString(row.id) : Number(row.id ?? 0),
    area: (row.location_name as string) || (row.district as string) || "Surabaya",
    category: mapCategory(row.category as string),
    description: row.description as string,
    media_url: Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : null,
    hashtags: Array.isArray(row.hashtags) ? row.hashtags : [],
    severity_score: 50,
    verification_score: 70,
    ai_summary: null,
    ai_status: (row.status as string) ?? "new",
    incident_id: null,
    likes: (row.upvotes_count as number) ?? 0,
    shares: 0,
    created_at: row.created_at as string,
    source_record_id: row.id as string,
  }
}

function mapCategory(cat: string): CategoryKey {
  const lower = (cat ?? "").toLowerCase()
  if (lower.includes("transportation") || lower.includes("kemacetan")) return "kemacetan"
  if (lower.includes("environment") || lower.includes("lingkungan")) return "lingkungan"
  if (lower.includes("urban") || lower.includes("jalan")) return "jalan_rusak"
  if (lower.includes("social") || lower.includes("sampah")) return "sampah"
  if (lower.includes("banjir")) return "banjir"
  if (lower.includes("lampu")) return "lampu_jalan"
  return "lingkungan"
}

// Public feed: private reporter fields are never selected.
export async function getPublicReports(category?: string): Promise<PublicReport[]> {
  const archivedIds = getArchivedSourceReports()
  
  const sourceReports =
    category && category !== "all"
      ? SOURCE_REPORTS.filter((report) => report.category === category && !archivedIds.has(report.id))
      : SOURCE_REPORTS.filter((report) => !archivedIds.has(report.id))

  if (!supabase) return sourceReports

  let query = supabase
    .from("reports")
    .select("id, description, category, subcategory, hashtags, latitude, longitude, location_name, district, status, images, upvotes_count, comments_count, created_at")
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(60)

  if (category && category !== "all") {
    const supabaseCategory = mapToSupabaseCategory(category)
    if (supabaseCategory) {
      query = query.eq("category", supabaseCategory)
    }
  }

  const { data, error } = await query
  if (error || !data) return sourceReports

  const citizenReports = data.map(mapSupabaseReport)
  return newestFirst([...citizenReports, ...sourceReports])
}

function mapToSupabaseCategory(cat: string): string | null {
  switch (cat) {
    case "kemacetan": return "Transportation"
    case "banjir":
    case "sampah":
    case "lingkungan": return "Environment"
    case "jalan_rusak":
    case "lampu_jalan": return "Urban"
    default: return null
  }
}

export async function getReportById(id: number): Promise<PublicReport | null> {
  const sourceReport = SOURCE_REPORTS.find((report) => report.id === id)
  if (sourceReport) return sourceReport
  if (!supabase) return null

  const { data, error } = await supabase
    .from("reports")
    .select("id, description, category, subcategory, hashtags, latitude, longitude, location_name, district, status, images, upvotes_count, comments_count, created_at")
    .eq("id", String(id))
    .eq("is_archived", false)
    .single()

  if (error || !data) return null
  return mapSupabaseReport(data)
}

export async function getIncidents(): Promise<Incident[]> {
  // incidents table doesn't exist in Supabase schema - use source data only
  const archivedIds = getArchivedSourceReports()
  return SOURCE_INCIDENTS.filter((incident) => !archivedIds.has(incident.id + 100_000))
}

export async function getActiveIncidents(): Promise<Incident[]> {
  const incidents = (await getIncidents()).filter(
    (incident) =>
      incident.origin === "integrated_source" || incident.status !== "resolved",
  )
  return incidents.filter((incident) => isWithinSurabaya(incident.lat, incident.lng))
}

export async function getTrending(): Promise<Incident[]> {
  return (await getIncidents())
    .filter(
      (incident) =>
        incident.origin === "integrated_source" || incident.status !== "resolved",
    )
    .sort((a, b) => b.impact_score - a.impact_score)
    .slice(0, 10)
}

export async function getComments(reportId: number): Promise<Comment[]> {
  if (SOURCE_REPORTS.some((report) => report.id === reportId)) return []
  if (!supabase) return []

  const { data, error } = await supabase
    .from("comments")
    .select("id, report_id, user_id, comment, created_at, profiles(username)")
    .eq("report_id", String(reportId))
    .order("created_at", { ascending: true })

  if (error || !data) return []

  return data.map((row) => ({
    id: 0,
    report_id: reportId,
    author: (row.profiles as { username?: string } | null)?.username ?? "Warga",
    content: row.comment,
    created_at: row.created_at,
  }))
}

interface CityStats {
  totalReports: number
  totalIncidents: number
  openIncidents: number
  resolvedIncidents: number
  avgSeverity: number
  affectedUsers: number
  byCategory: { category: CategoryKey; count: number }[]
  byArea: { area: string; count: number; avg_severity: number }[]
  reportsToday: number
}

function sourceStats(): CityStats {
  const byCategory = Object.entries(
    SOURCE_REPORTS.reduce<Record<string, number>>((counts, report) => {
      counts[report.category] = (counts[report.category] ?? 0) + 1
      return counts
    }, {}),
  )
    .map(([category, count]) => ({ category: category as CategoryKey, count }))
    .sort((a, b) => b.count - a.count)

  const areaBuckets = SOURCE_REPORTS.reduce<
    Record<string, { count: number; severity: number }>
  >((buckets, report) => {
    const bucket = buckets[report.area] ?? { count: 0, severity: 0 }
    bucket.count += 1
    bucket.severity += report.severity_score
    buckets[report.area] = bucket
    return buckets
  }, {})

  const byArea = Object.entries(areaBuckets)
    .map(([area, value]) => ({
      area,
      count: value.count,
      avg_severity: Math.round(value.severity / value.count),
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalReports: SOURCE_REPORTS.length,
    totalIncidents: SOURCE_INCIDENTS.length,
    openIncidents: SOURCE_INCIDENTS.filter((incident) => incident.status !== "resolved").length,
    resolvedIncidents: SOURCE_INCIDENTS.filter((incident) => incident.status === "resolved").length,
    avgSeverity: Math.round(
      SOURCE_REPORTS.reduce((sum, report) => sum + report.severity_score, 0) /
        SOURCE_REPORTS.length,
    ),
    affectedUsers: 0,
    reportsToday: SOURCE_REPORTS.filter(
      (report) => Date.now() - Date.parse(report.created_at) < 24 * 60 * 60 * 1000,
    ).length,
    byCategory,
    byArea,
  }
}

export async function getCityStats(): Promise<CityStats> {
  const sourced = sourceStats()
  if (!supabase) return sourced

  // Fetch counts from Supabase
  const [totalResult, todayResult] = await Promise.all([
    supabase.from("reports").select("id", { count: "exact", head: true }),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ])

  const dbTotalReports = totalResult.count ?? 0
  const dbReportsToday = todayResult.count ?? 0

  const totalReports = dbTotalReports + sourced.totalReports

  return {
    totalReports,
    totalIncidents: sourced.totalIncidents,
    openIncidents: sourced.openIncidents,
    resolvedIncidents: sourced.resolvedIncidents,
    avgSeverity: sourced.avgSeverity,
    affectedUsers: sourced.affectedUsers,
    reportsToday: dbReportsToday + sourced.reportsToday,
    byCategory: sourced.byCategory,
    byArea: sourced.byArea,
  }
}
