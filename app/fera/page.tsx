import { cookies } from "next/headers"
import { getPublicReports } from "@/lib/data"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { LockKeyhole, LogOut, ShieldAlert, Trash2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FeraAdminPage() {
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.get("fera_admin_session")?.value === "authenticated"

  async function loginAdmin(formData: FormData) {
    "use server"
    const password = formData.get("password") as string
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

    if (password === ADMIN_PASSWORD) {
      const cookieStore = await cookies()
      cookieStore.set("fera_admin_session", "authenticated", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })
      revalidatePath("/fera")
    } else {
      // In a real app we'd return an error state, but for simplicity here we just revalidate
      revalidatePath("/fera")
    }
  }

  async function logoutAdmin() {
    "use server"
    const cookieStore = await cookies()
    cookieStore.delete("fera_admin_session")
    revalidatePath("/fera")
  }

  async function deleteReport(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    const sourceRecordId = formData.get("source_record_id") as string
    if (!id) return
    const numId = Number(id)
    
    if (numId >= 900000) {
      // Ini adalah report dari data statis (source data bawaan)
      const { archiveSourceReport } = await import("@/lib/data")
      archiveSourceReport(numId)
    } else {
      // Ini adalah report dari Supabase (laporan warga)
      let supabaseClient;
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
         const { createClient: createAdminClient } = await import("@supabase/supabase-js")
         supabaseClient = createAdminClient(
           process.env.NEXT_PUBLIC_SUPABASE_URL!,
           process.env.SUPABASE_SERVICE_ROLE_KEY
         )
      } else {
         supabaseClient = await createClient()
      }
      
      const targetId = sourceRecordId || id
      
      const { error } = await supabaseClient.from("reports").update({ is_archived: true }).eq("id", targetId)
      if (error) {
        console.error("Gagal menghapus di Supabase (kemungkinan RLS policy):", error)
        const { error: deleteError } = await supabaseClient.from("reports").delete().eq("id", targetId)
        if (deleteError) {
           console.error("Gagal hard-delete di Supabase:", deleteError)
        }
      }
    }

    revalidatePath("/fera")
    revalidatePath("/feed")
    revalidatePath("/trending")
    revalidatePath("/dashboard")
    revalidatePath("/")
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          {/* Decorative background gradients */}
          <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/80 to-primary/20 shadow-lg">
              <ShieldAlert className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-white">
              Restricted Area
            </h1>
            <p className="mb-8 text-center text-sm text-white/60">
              Silakan masukkan password admin untuk melanjutkan ke halaman panel kontrol.
            </p>

            <form action={loginAdmin} className="w-full space-y-4">
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password Admin"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white placeholder-white/40 outline-none transition-all focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/20"
                />
              </div>
              
              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-4 py-3.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] active:scale-[0.98]"
              >
                Masuk ke Panel
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  const reports = await getPublicReports()

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShieldAlert className="h-6 w-6 text-primary" /> Panel Admin Fera
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor dan hapus laporan warga yang tidak pantas atau tidak berbobot.
          </p>
        </div>
        <form action={logoutAdmin}>
          <Button type="submit" variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" /> Keluar
          </Button>
        </form>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="group flex flex-col justify-between gap-4 rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">
                  {report.category}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{report.area}</span>
              </div>
              <p className="text-sm leading-relaxed text-card-foreground">
                {report.description}
              </p>
            </div>
            
            <form action={deleteReport} className="shrink-0">
              <input type="hidden" name="id" value={report.id} />
              {report.source_record_id && (
                <input type="hidden" name="source_record_id" value={report.source_record_id} />
              )}
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                className="w-full gap-1.5 transition-all group-hover:bg-destructive/90 sm:w-auto"
              >
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </form>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-3">
              <ShieldAlert className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Belum ada laporan di database.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
