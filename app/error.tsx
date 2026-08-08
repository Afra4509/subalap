"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4 py-12 sm:px-6">
      <Card className="w-full items-center p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="font-display text-2xl font-bold">Data gagal dimuat</h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Koneksi atau layanan data sedang bermasalah. Data Anda tidak berubah.
        </p>
        <Button type="button" onClick={reset}>
          <RefreshCw className="size-4" />
          Coba lagi
        </Button>
      </Card>
    </main>
  )
}
