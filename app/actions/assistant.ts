"use server"

import { getCategory } from "@/lib/categories"
import { getIncidents, getPublicReports } from "@/lib/data"
export interface AssistantAnswer {
  answer: string
  sources: { area: string; category: string; reportCount: number; severity: number }[]
  error?: string
}

// Generative AI City Assistant. Uses real-time city incidents and citizen feeds as context.
export async function askAssistant(query: string, localReports: any[] = []): Promise<AssistantAnswer> {
  const safeQuery = query.trim().slice(0, 300)
  if (safeQuery.length < 2) return { answer: "", sources: [], error: "Pertanyaan terlalu pendek." }

  try {
    const available = (await getIncidents()).filter(
      (incident) =>
        incident.origin === "integrated_source" || incident.status !== "resolved",
    )
    
    // Ambil laporan mentah terbaru dari warga (feeds) ditambah laporan lokal dari browser
    const serverFeeds = await getPublicReports("all")
    const recentFeeds = [...localReports, ...serverFeeds].slice(0, 8)
    
    // Sort by impact to provide the most relevant data
    const incidents = available.sort((a, b) => b.impact_score - a.impact_score).slice(0, 8)

    const sources = incidents.slice(0, 5).map((i) => ({
      area: i.area,
      category: getCategory(i.category).label,
      reportCount: i.report_count,
      severity: i.avg_severity,
    }))

    const contextData = incidents.map(i => {
      const summary = (i.ai_summary || 'Tidak ada deskripsi').slice(0, 80)
      return `- ${i.area}: ${i.title} | ${getCategory(i.category).label} | Dampak ${i.impact_score}/100 | ${i.report_count} laporan | ${summary}`
    }).join("\n")
    
    const feedData = recentFeeds.map(f => {
      const desc = f.description.slice(0, 80)
      return `- ${f.area} | ${getCategory(f.category).label}: "${desc}"`
    }).join("\n")

    const systemPrompt = `Anda adalah Asisten AI Resmi untuk Kota Surabaya ("SUBALAP").
Tugas Anda adalah menjawab pertanyaan warga mengenai kondisi kota, kemacetan, banjir, jalan rusak, dan masalah lingkungan.

Gunakan DATA INSIDEN (Isu Besar) dan FEED LAPORAN WARGA (Kejadian Terbaru) berikut sebagai SATU-SATUNYA referensi utama Anda. 
Jika ditanya wilayah tertentu, periksa kedua sumber tersebut. Jika tidak ada di data, beritahu bahwa belum ada laporan warga di daerah tersebut.
Selalu gunakan bahasa Indonesia yang ramah, ringkas, natural, dan jelas. Jawab seolah-olah Anda ahli pemantau kota.

=== DATA INSIDEN TERBESAR ===
${contextData.length > 0 ? contextData : 'Saat ini tidak ada isu besar.'}

=== FEED LAPORAN WARGA TERBARU ===
${feedData.length > 0 ? feedData : 'Belum ada laporan warga terbaru.'}`

    const apiUrl = process.env.AI_API_URL || "https://api.groq.com/openai/v1/chat/completions"
    const apiKey = process.env.AI_API_KEY
    const modelName = process.env.AI_MODEL_NAME || "llama-3.1-8b-instant"

    if (!apiKey) {
      return { answer: "", sources, error: "API Key AI belum dikonfigurasi. Tambahkan AI_API_KEY di environment variables Vercel." }
    }

    const body = JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: safeQuery }
      ],
      temperature: 0.3,
      max_tokens: 400
    })

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    }

    // Attempt fetch with 1 retry on rate limit (429)
    let lastError = ""
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      let response: Response
      try {
        response = await fetch(apiUrl, { method: "POST", headers, body, signal: controller.signal })
        clearTimeout(timeoutId)
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        const isTimeout = fetchError?.name === "AbortError"
        lastError = isTimeout
          ? "Koneksi ke layanan AI timeout (>15 detik). Coba lagi."
          : `Gagal menghubungi layanan AI: ${fetchError?.message ?? "network error"}`
        console.error("AI fetch error:", fetchError)
        break // network errors won't improve with retry
      }

      if (response.status === 429 && attempt === 0) {
        // Rate limited — wait 2.5s then retry once
        console.warn("AI rate limited (429), retrying in 2.5s...")
        await new Promise(r => setTimeout(r, 2500))
        continue
      }

      if (!response.ok) {
        const errText = await response.text()
        console.error("AI API error:", response.status, errText)
        lastError = `Layanan AI error (HTTP ${response.status}). Periksa AI_API_KEY dan AI_MODEL_NAME. Detail: ${errText.slice(0, 200)}`
        break
      }

      const data = await response.json()
      const answer = data.choices?.[0]?.message?.content || "Maaf, asisten tidak memberikan jawaban."
      return { answer, sources }
    }

    return { answer: "", sources, error: lastError || "Gagal mendapatkan jawaban dari AI." }
  } catch (error: any) {
    console.error("Assistant unexpected error:", error)
    return {
      answer: "",
      sources: [],
      error: `Terjadi kesalahan tak terduga: ${error?.message ?? String(error)}`
    }
  }
}
