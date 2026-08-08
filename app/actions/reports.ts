"use server"

import { analyzeReport, SURABAYA_AREAS, computeImpactScore } from "@/lib/ai-analysis"
import { getComments, getReportById } from "@/lib/data"
import { isWithinSurabaya } from "@/lib/surabaya-geo"
import type { CategoryKey, Comment } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { supabase as globalSupabase } from "@/lib/db"

export interface CreateReportInput {
  name: string
  email: string
  whatsapp?: string
  area: string
  category: CategoryKey
  description: string
  mediaUrl?: string | null
  lat?: number | null
  lng?: number | null
}

function mapToSupabaseCategory(cat: string): string {
  switch (cat) {
    case "kemacetan": return "Transportation"
    case "banjir":
    case "sampah":
    case "lingkungan": return "Environment"
    case "jalan_rusak":
    case "lampu_jalan": return "Urban"
    default: return "Environment"
  }
}

export async function createReport(input: CreateReportInput) {
  const categories: CategoryKey[] = [
    "banjir",
    "jalan_rusak",
    "sampah",
    "lampu_jalan",
    "kemacetan",
    "lingkungan",
  ]
  const name = input.name.trim()
  const email = input.email.trim()
  const description = input.description.trim()
  const whatsapp = input.whatsapp?.trim() ?? ""
  const mediaUrl = input.mediaUrl?.trim() || null
  const validMedia =
    mediaUrl === null ||
    (mediaUrl.length <= 750_000 &&
      /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(mediaUrl))
  const hasCoordinates = input.lat != null || input.lng != null
  const validCoordinates =
    !hasCoordinates ||
    (Number.isFinite(input.lat) &&
      Number.isFinite(input.lng) &&
      isWithinSurabaya(input.lat!, input.lng!))
  if (
    name.length < 2 ||
    name.length > 80 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 160 ||
    description.length < 10 ||
    description.length > 1500 ||
    whatsapp.length > 24 ||
    !categories.includes(input.category) ||
    !SURABAYA_AREAS[input.area] ||
    !validCoordinates ||
    !validMedia
  ) {
    throw new Error("Data laporan tidak valid.")
  }

  // Simulated AI pipeline runs synchronously and returns structured output.
  const analysis = analyzeReport({
    description,
    category: input.category,
    area: input.area,
    hasMedia: Boolean(input.mediaUrl),
  })

  const coords =
    input.lat != null && input.lng != null
      ? { lat: input.lat, lng: input.lng }
      : (SURABAYA_AREAS[input.area] ?? { lat: -7.2575, lng: 112.7521 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!globalSupabase) {
    throw new Error("Database belum dikonfigurasi.")
  }

  const images = mediaUrl ? [mediaUrl] : []

  const insertData: any = {
      description,
      category: mapToSupabaseCategory(analysis.category),
      subcategory: input.area,
      hashtags: analysis.hashtags,
      latitude: coords.lat,
      longitude: coords.lng,
      location_name: input.area,
      images,
      status: 'new'
  }

  if (user) {
      insertData.user_id = user.id
  } else {
      // Allow anonymous users to use a default or null user_id if the DB allows it
      // Otherwise Supabase will throw a constraint error which is what we want to surface.
  }

  const { data, error } = await supabase
    .from("reports")
    .insert(insertData)
    .select("id")
    .single()

  if (error || !data) {
    console.error("Supabase insert error:", error)
    if (error?.message?.includes('not-null constraint')) {
        throw new Error("Gagal: Database mengharuskan Anda login (user_id required). Silakan login atau ubah pengaturan Supabase Anda.")
    }
    if (error?.message?.includes('policy')) {
        throw new Error("Gagal: Diblokir oleh aturan keamanan (RLS) Supabase. Izinkan insert anonim di dashboard Supabase.")
    }
    throw new Error(`Gagal menyimpan ke database: ${error?.message || 'Unknown error'}`)
  }

  const reportId = data.id

  revalidatePath("/feed")
  revalidatePath("/map")
  revalidatePath("/trending")
  revalidatePath("/dashboard")

  return {
    reportId,
    analysis,
    persisted: true,
  }
}

export async function likeReport(reportId: number | string) {
  if (!globalSupabase) return ((await getReportById(Number(reportId)))?.likes ?? 0) + 1
  
  const supabase = await createClient()
  // Try to use the toggle_upvote RPC if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (user && typeof reportId === 'string') {
    await supabase.rpc('toggle_upvote', { p_report_id: reportId })
  }

  revalidatePath("/feed")
  
  if (typeof reportId === 'string') {
    const { data } = await supabase.from('reports').select('upvotes_count').eq('id', reportId).single()
    return data?.upvotes_count ?? 0
  }
  return 0
}

export async function shareReport(reportId: number | string) {
  if (!globalSupabase) return ((await getReportById(Number(reportId)))?.shares ?? 0) + 1
  // Supabase doesn't have a shares column yet, just return 0
  return 0
}

export async function getReportComments(reportId: number | string): Promise<Comment[]> {
  return getComments(Number(reportId))
}

export async function addComment(reportId: number | string, content: string, author = "Citizen") {
  const safeContent = content.trim()
  const safeAuthor = author.trim() || "Citizen"
  
  if (safeContent.length < 1 || safeContent.length > 500) {
    throw new Error("Komentar tidak valid.")
  }

  // Pake analisis dataset untuk kata kasar (menggunakan dynamic import dengan destructuring)
  const { isToxic } = await import("@/lib/ai-analysis")
  if (isToxic(safeContent)) {
    throw new Error("Komentar Anda mengandung kata-kata tidak pantas. Mohon jaga kesopanan.")
  }

  if (!globalSupabase) {
    return {
      id: Date.now(),
      report_id: Number(reportId),
      content: safeContent,
      author: safeAuthor.slice(0, 80),
      created_at: new Date().toISOString(),
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || typeof reportId !== 'string') {
    throw new Error("Harus login untuk berkomentar.")
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      report_id: reportId,
      user_id: user.id,
      comment: safeContent
    })
    .select("*, profiles(username)")
    .single()

  if (error || !data) {
    throw new Error("Gagal menyimpan komentar.")
  }

  revalidatePath("/feed")
  
  return {
    id: Date.now(),
    report_id: Number(reportId),
    content: data.comment,
    author: data.profiles?.username || "Citizen",
    created_at: data.created_at,
  }
}
