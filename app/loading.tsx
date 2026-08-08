import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6" aria-busy="true">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-4 h-10 w-full max-w-md" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-56 rounded-xl" />
        ))}
      </div>
      <span className="sr-only">Memuat halaman…</span>
    </main>
  )
}
