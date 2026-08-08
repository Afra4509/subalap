import Image from "next/image"
import { cn } from "@/lib/utils"

export function BrandMark({
  className,
  priority = false,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <span className={cn("relative block shrink-0", className)}>
      <Image
        src="/brand/subalap-mark-128.png"
        alt=""
        fill
        priority={priority}
        sizes="128px"
        className="object-contain"
      />
    </span>
  )
}

export function BrandLogo({
  className,
  markClassName,
  showTagline = false,
  priority = false,
}: {
  className?: string
  markClassName?: string
  showTagline?: boolean
  priority?: boolean
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BrandMark className={cn("size-10", markClassName)} priority={priority} />
      <span className="min-w-0 leading-none">
        <span className="block whitespace-nowrap font-display text-lg font-extrabold tracking-tight text-foreground">
          SUBA<span className="text-primary">LAP</span>
        </span>
        {showTagline && (
          <span className="mt-1 block whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Suara warga, kecerdasan kota
          </span>
        )}
      </span>
    </span>
  )
}
