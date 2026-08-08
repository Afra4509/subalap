import type { Metadata } from "next"
import { Bot } from "lucide-react"
import { AssistantChat } from "@/components/assistant-chat"

export const metadata: Metadata = {
  title: "Asisten Kondisi Surabaya",
  description: "Tanyakan kondisi wilayah Surabaya berdasarkan data insiden yang tersedia.",
}

export default function AssistantPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="flex items-center gap-2 text-sm font-medium text-primary">
        <Bot className="h-4 w-4" /> Asisten Kota AI
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Asisten kondisi Surabaya</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Tanyakan situasi wilayah berdasarkan data insiden yang tersedia.
      </p>
      <div className="mt-8">
        <AssistantChat />
      </div>
    </main>
  )
}
