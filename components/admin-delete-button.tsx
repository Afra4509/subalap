"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useFormStatus } from "react-dom"

export function AdminDeleteButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button
      type="submit"
      variant="destructive"
      size="sm"
      disabled={pending}
      className="w-full gap-1.5 transition-all group-hover:bg-destructive/90 sm:w-auto"
      onClick={(e) => {
        if (!confirm("Apakah Anda yakin ingin menghapus laporan ini?")) {
          e.preventDefault()
        }
      }}
    >
      <Trash2 className="h-4 w-4" /> {pending ? "Menghapus..." : "Hapus"}
    </Button>
  )
}
