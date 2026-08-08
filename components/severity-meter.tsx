"use client"

import { useEffect, useState } from "react"
import { severityLabel } from "@/lib/categories"
import { cn } from "@/lib/utils"

export function SeverityMeter({ score, animate = true, showLabel = true }: { score: number; animate?: boolean; showLabel?: boolean }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)))
  const [display, setDisplay] = useState(animate ? 0 : safeScore)
  const { label, color } = severityLabel(safeScore)

  useEffect(() => {
    if (!animate) {
      setDisplay(safeScore)
      return
    }
    let raf: number
    const start = performance.now()
    const duration = 800
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setDisplay(Math.round(safeScore * p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [safeScore, animate])

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Tingkat Urgensi</span>
        {showLabel && (
          <span className="font-semibold" style={{ color }}>
            {display}/100 · {label}
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          role="progressbar"
          aria-label={`Tingkat urgensi ${safeScore} dari 100, ${label}`}
          aria-valuenow={safeScore}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn("h-full rounded-full transition-[width] duration-300")}
          style={{ width: `${display}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
