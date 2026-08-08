"use client"

import { useEffect, useState } from "react"
import { Laptop, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const THEMES = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Ikuti perangkat", icon: Laptop },
] as const

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  const activeTheme = mounted ? theme ?? "system" : "system"
  const ActiveIcon =
    activeTheme === "light" ? Sun : activeTheme === "dark" ? Moon : Laptop

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "shrink-0",
        )}
        aria-label="Pilih tema tampilan"
        title="Tema tampilan"
      >
        <ActiveIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuRadioGroup value={activeTheme} onValueChange={setTheme}>
          <DropdownMenuLabel>Tema tampilan</DropdownMenuLabel>
          {THEMES.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value} className="py-2">
              <item.icon className="size-4 text-muted-foreground" />
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
