import Link from "next/link"
import { ArrowLeft, MapPinOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4 py-12 sm:px-6">
      <Card className="w-full items-center p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MapPinOff className="size-6" />
        </span>
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="font-display text-2xl font-bold">Halaman tidak ditemukan</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Alamat mungkin berubah atau halaman sudah tidak tersedia.
        </p>
        <Button render={<Link href="/" />} nativeButton={false}>
          <ArrowLeft className="size-4" />
          Kembali ke beranda
        </Button>
      </Card>
    </main>
  )
}
