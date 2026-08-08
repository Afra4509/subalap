import { Waves, Construction, Trash2, Lightbulb, TrafficCone, Leaf, type LucideProps } from "lucide-react"

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  waves: Waves,
  construction: Construction,
  "trash-2": Trash2,
  lightbulb: Lightbulb,
  "traffic-cone": TrafficCone,
  leaf: Leaf,
}

export function CategoryIcon({ icon, ...props }: { icon: string } & LucideProps) {
  const Icon = ICONS[icon] ?? Waves
  return <Icon {...props} />
}
