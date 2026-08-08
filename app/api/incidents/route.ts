import { NextResponse } from "next/server"
import { getActiveIncidents } from "@/lib/data"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const incidents = await getActiveIncidents()
    return NextResponse.json(incidents, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch {
    return NextResponse.json({ error: "Gagal memuat insiden." }, { status: 500 })
  }
}
