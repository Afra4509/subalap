"use client"

import { useRef, useState } from "react"
import { Bot, Loader2, Send, Sparkles } from "lucide-react"
import { askAssistant, type AssistantAnswer } from "@/app/actions/assistant"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const EXAMPLES = [
  "Bagaimana kondisi Rungkut sekarang?",
  "Apakah Wonokromo aman dilewati?",
  "Apa isu paling berdampak di Surabaya?",
]

export function AssistantChat() {
  const pendingRef = useRef(false)
  const [query, setQuery] = useState("")
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(value = query) {
    const clean = value.trim()
    if (clean.length < 2 || pendingRef.current) return
    pendingRef.current = true
    setQuery(clean)
    setLoading(true)
    setError("")
    setAnswer(null)
    try {
      let localReports = []
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("subalap-local-reports")
        if (stored) localReports = JSON.parse(stored)
      }
      const result = await askAssistant(clean, localReports)
      if (result.error) {
        setError(result.error)
      } else {
        setAnswer(result)
      }
    } catch {
      setError("Asisten gagal memproses pertanyaan. Coba lagi.")
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <Card className="min-h-[430px] p-5 sm:p-7" aria-busy={loading}>
        {!answer && !loading && (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-display text-xl font-bold">Tanya kondisi kota</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Jawaban dirangkum dari insiden dan laporan warga yang tersedia.
            </p>
          </div>
        )}

        {loading && (
          <div
            className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
            aria-live="polite"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            Menganalisis data kota…
          </div>
        )}

        {answer && !loading && (
          <div aria-live="polite">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Pertanyaan</p>
            <p className="mt-2 font-medium">{query}</p>
            <div className="mt-5 rounded-xl bg-secondary/60 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> Jawaban
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{answer.answer}</p>
            </div>
            {answer.sources.length > 0 && (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {answer.sources.map((source, index) => (
                  <div key={`${source.area}-${source.category}-${index}`} className="rounded-lg border p-3 text-xs">
                    <p className="font-semibold">{source.area} · {source.category}</p>
                    <p className="mt-1 text-muted-foreground">
                      {source.reportCount} laporan · urgensi {source.severity}/100
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <form
          className="mt-6 flex gap-2 border-t pt-5"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={300}
            placeholder="Tanyakan wilayah atau kondisi kota…"
            aria-label="Pertanyaan untuk asisten kota"
          />
          <Button type="submit" size="icon-lg" disabled={loading || query.trim().length < 2}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Kirim pertanyaan</span>
          </Button>
        </form>
      </Card>

      <Card className="h-fit p-5">
        <h2 className="font-display font-semibold">Contoh pertanyaan</h2>
        <div className="mt-3 space-y-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => void submit(example)}
              disabled={loading}
              className="min-h-11 w-full rounded-lg border p-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
