export type CategoryKey =
  | "banjir"
  | "jalan_rusak"
  | "sampah"
  | "lampu_jalan"
  | "kemacetan"
  | "lingkungan"

export type IncidentStatus = "open" | "in_progress" | "resolved"
export type ReportOrigin =
  | "citizen"
  | "local_citizen"
  | "public_source"
  | "integrated_source"

export interface ReportSource {
  publisher: string
  title: string
  url: string
  published_date: string
  source_type: string
}

export interface IncidentLocation {
  name: string
  address: string
  lat: number
  lng: number
  precision: string
  accuracy_m: number | null
}

// Public-facing report: private fields (name, email, whatsapp) are stripped.
export interface PublicReport {
  id: number
  title?: string | null
  area: string
  category: CategoryKey
  description: string
  media_url: string | null
  hashtags: string[]
  severity_score: number
  verification_score: number
  ai_summary: string | null
  ai_status: string
  incident_id: number | null
  likes: number
  shares: number
  created_at: string
  origin?: ReportOrigin
  source_name?: string | null
  source_record_id?: string | null
  event_date_label?: string | null
  event_time?: string | null
  location_detail?: string | null
  urgency_label?: "Tinggi" | "Sedang" | "Rendah" | null
  event_type?: string | null
  verification_status?: string | null
  verification_confidence?: string | null
  verification_notes?: string | null
  source_links?: ReportSource[]
  location_points?: IncidentLocation[]
}

export interface Incident {
  id: number
  title: string
  hashtag: string
  category: CategoryKey
  area: string
  lat: number
  lng: number
  report_count: number
  affected_users: number
  avg_severity: number
  engagement: number
  avg_verification: number
  impact_score: number
  status: IncidentStatus
  ai_summary: string | null
  last_updated_at: string
  created_at: string
  origin?: ReportOrigin
  location_points?: IncidentLocation[]
}

export interface Comment {
  id: number
  report_id: number
  author: string
  content: string
  created_at: string
}
