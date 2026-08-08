import type { CategoryKey, IncidentStatus } from "./types"

interface CategoryMeta {
  key: CategoryKey
  label: string
  icon: string
  color: string
}

// Shared static metadata lets client components render without a round trip.
export const CATEGORIES: CategoryMeta[] = [
  { key: "banjir", label: "Banjir", icon: "waves", color: "#0ea5e9" },
  { key: "jalan_rusak", label: "Jalan Rusak", icon: "construction", color: "#f59e0b" },
  { key: "sampah", label: "Sampah", icon: "trash-2", color: "#22c55e" },
  { key: "lampu_jalan", label: "Lampu Jalan", icon: "lightbulb", color: "#eab308" },
  { key: "kemacetan", label: "Kemacetan", icon: "traffic-cone", color: "#ef4444" },
  { key: "lingkungan", label: "Lingkungan", icon: "leaf", color: "#10b981" },
]

const CATEGORY_MAP: Record<CategoryKey, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<CategoryKey, CategoryMeta>

export function getCategory(key: string): CategoryMeta {
  return CATEGORY_MAP[key as CategoryKey] ?? CATEGORIES[0]
}

export function normalizeCategoryFilter(value?: string): CategoryKey | "all" {
  if (!value || value === "all") return "all"
  return value in CATEGORY_MAP ? (value as CategoryKey) : "all"
}

export const STATUS_META: Record<IncidentStatus, { label: string; color: string }> = {
  open: { label: "Belum Ditangani", color: "#ef4444" },
  in_progress: { label: "Sedang Ditangani", color: "#f59e0b" },
  resolved: { label: "Selesai", color: "#22c55e" },
}

export function severityLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Kritis", color: "#ef4444" }
  if (score >= 60) return { label: "Tinggi", color: "#f59e0b" }
  if (score >= 40) return { label: "Sedang", color: "#eab308" }
  return { label: "Rendah", color: "#22c55e" }
}
