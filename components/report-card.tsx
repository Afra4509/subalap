"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Heart,
  Share2,
  MessageCircle,
  ShieldCheck,
  MapPin,
  Sparkles,
  Loader2,
  Send,
  BookOpenCheck,
  CalendarDays,
  Clock3,
  ExternalLink,
  HardDrive,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CategoryIcon } from "@/components/category-icon"
import { SeverityMeter } from "@/components/severity-meter"
import { getCategory } from "@/lib/categories"
import {
  addComment,
  getReportComments,
  likeReport,
  shareReport,
} from "@/app/actions/reports"
import type { Comment, PublicReport } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
})

function formatDate(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? "Waktu tidak tersedia" : dateFormatter.format(date)
}

export function ReportCard({ report }: { report: PublicReport }) {
  const category = getCategory(report.category)
  const isIntegratedRecord = report.origin === "integrated_source"
  const isSourceRecord =
    report.origin === "public_source" || isIntegratedRecord
  const isLocalReport = report.origin === "local_citizen"
  const hasServerInteractions = !isSourceRecord && !isLocalReport
  const [likes, setLikes] = useState(report.likes)
  const [liked, setLiked] = useState(false)
  const [likePending, setLikePending] = useState(false)
  const [shares, setShares] = useState(report.shares)
  const [sharePending, setSharePending] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [comment, setComment] = useState("")
  const [commentPending, setCommentPending] = useState(false)

  useEffect(() => {
    try {
      const likedReports = JSON.parse(localStorage.getItem("subalap-liked-reports") ?? "[]") as number[]
      setLiked(likedReports.includes(report.id))
    } catch {
      // Corrupt local preference must not block the feed.
    }
  }, [report.id])

  async function handleLike() {
    if (liked || likePending) return
    setLikePending(true)
    setLiked(true)
    setLikes((value) => value + 1)
    try {
      const updatedLikes = await likeReport(report.id)
      setLikes(updatedLikes)
      try {
        const stored = JSON.parse(localStorage.getItem("subalap-liked-reports") ?? "[]") as number[]
        localStorage.setItem(
          "subalap-liked-reports",
          JSON.stringify(Array.from(new Set([...stored, report.id]))),
        )
      } catch {
        // Browser storage can be unavailable; server update still succeeded.
      }
    } catch {
      setLiked(false)
      setLikes((value) => Math.max(report.likes, value - 1))
      toast.error("Dukungan gagal dikirim.")
    } finally {
      setLikePending(false)
    }
  }

  async function handleShare() {
    if (sharePending) return
    setSharePending(true)
    const url = `${window.location.origin}/feed#report-${report.id}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${category.label} di ${report.area}`,
          text: report.ai_summary ?? report.description,
          url,
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        toast.success("Tautan laporan disalin.")
      } else {
        throw new Error("Fitur berbagi tidak tersedia.")
      }
      if (hasServerInteractions) setShares(await shareReport(report.id))
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      toast.error("Laporan gagal dibagikan.")
    } finally {
      setSharePending(false)
    }
  }

  async function toggleComments() {
    const nextOpen = !commentsOpen
    setCommentsOpen(nextOpen)
    if (!nextOpen || commentsLoaded || commentsLoading) return

    setCommentsLoading(true)
    try {
      setComments(await getReportComments(report.id))
      setCommentsLoaded(true)
    } catch {
      toast.error("Komentar gagal dimuat.")
    } finally {
      setCommentsLoading(false)
    }
  }

  async function handleComment(event: React.FormEvent) {
    event.preventDefault()
    const clean = comment.trim()
    if (!clean || commentPending) return

    setCommentPending(true)
    try {
      const created = await addComment(report.id, clean)
      setComments((current) => [...current, created as Comment])
      setCommentsLoaded(true)
      setComment("")
      toast.success("Komentar ditambahkan.")
    } catch {
      toast.error("Komentar gagal dikirim.")
    } finally {
      setCommentPending(false)
    }
  }

  return (
    <Card id={`report-${report.id}`} className="scroll-mt-28 overflow-hidden p-0 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <Avatar className="h-10 w-10 ring-2 ring-primary/10">
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
            {isIntegratedRecord ? "TI" : isSourceRecord ? "DS" : isLocalReport ? "LP" : "WR"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
            <span className="font-semibold">
              {isSourceRecord
                ? isIntegratedRecord
                  ? "Laporan terintegrasi"
                  : "Data sumber publik"
                : isLocalReport
                  ? "Laporan perangkat ini"
                  : "Laporan Warga"}
            </span>
            {isSourceRecord ? (
              <span className="inline-flex items-center gap-0.5 text-xs text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isIntegratedRecord ? "Terverifikasi sumber" : "Sumber tercatat"}
              </span>
            ) : report.verification_score >= 80 ? (
              <span className="inline-flex items-center gap-0.5 text-xs text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Terverifikasi AI
              </span>
            ) : null}
            {report.event_date_label ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> {report.event_date_label}
              </span>
            ) : (
              <time dateTime={report.created_at} className="text-muted-foreground">
                · {formatDate(report.created_at)} WIB
              </time>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {report.area}
          </div>
        </div>
        <Badge
          className="shrink-0 gap-1 border-0 text-xs"
          style={{ backgroundColor: `${category.color}22`, color: category.color }}
        >
          <CategoryIcon icon={category.icon} className="h-3 w-3" />
          {category.label}
        </Badge>
      </div>

      <div className="px-4 pb-3 sm:px-5">
        {report.title && (
          <h2 className="mb-2 text-balance font-display text-lg font-bold leading-snug">
            {report.title}
          </h2>
        )}
        <p className="text-[15px] leading-relaxed">{report.description}</p>
        {report.location_detail && (
          <div className="mt-3 rounded-xl border bg-secondary/35 p-3 text-xs text-muted-foreground">
            <p className="flex items-start gap-2 leading-relaxed">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                <strong className="text-foreground">Lokasi:</strong> {report.location_detail}
              </span>
            </p>
            {report.event_time && (
              <p className="mt-1.5 flex items-start gap-2 leading-relaxed">
                <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  <strong className="text-foreground">Waktu:</strong> {report.event_time}
                </span>
              </p>
            )}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {report.hashtags.map((hashtag) => (
            <span key={hashtag} className="text-sm font-medium text-primary">
              #{hashtag}
            </span>
          ))}
        </div>
      </div>

      {report.media_url && (
        <div className="relative mx-4 mb-4 aspect-video overflow-hidden rounded-xl border border-border bg-secondary sm:mx-5">
          <Image
            src={report.media_url}
            alt={`Foto laporan ${category.label} di ${report.area}`}
            fill
            sizes="(min-width: 1024px) 520px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="px-4 sm:px-5">
        <SeverityMeter score={report.severity_score} animate={false} />
      </div>

      {report.ai_summary && (
        <div className="mx-4 mt-3 flex gap-2 rounded-xl border border-primary/10 bg-primary/5 p-3 sm:mx-5">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">{report.ai_summary}</p>
        </div>
      )}

      {isSourceRecord && (
        <div className="mx-4 mt-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-3 text-xs sm:mx-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <BookOpenCheck className="size-4 shrink-0 text-primary" />
              <span className="truncate">
                Sumber: <strong className="text-foreground">{report.source_name}</strong>
              </span>
            </span>
            <span className="font-mono text-[11px] text-primary">
              {report.source_record_id}
            </span>
          </div>
          {isIntegratedRecord && report.verification_notes && (
            <p className="mt-2 border-t border-primary/10 pt-2 leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Catatan verifikasi:</strong>{" "}
              {report.verification_notes}
            </p>
          )}
          {report.source_links && report.source_links.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {report.source_links.map((source, index) => (
                <a
                  key={`${source.url}-${index}`}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-primary/15 bg-background/70 px-2.5 font-semibold text-primary transition-colors hover:bg-background"
                  aria-label={`Buka sumber ${source.publisher}: ${source.title}`}
                >
                  Sumber {index + 1} · {source.publisher}
                  <ExternalLink className="size-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {hasServerInteractions ? (
        <div className="mt-4 grid grid-cols-3 border-t border-border/60 px-2 py-1.5">
        <button
          type="button"
          onClick={handleLike}
          disabled={liked || likePending}
          aria-label={`${liked ? "Sudah mendukung" : "Dukung"} laporan. ${likes} dukungan`}
          className={cn(
            "flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-80",
            liked ? "text-destructive" : "text-muted-foreground",
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {likes}
        </button>
        <button
          type="button"
          onClick={() => void toggleComments()}
          aria-expanded={commentsOpen}
          aria-controls={`comments-${report.id}`}
          className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          Diskusi{comments.length > 0 ? ` (${comments.length})` : ""}
        </button>
        <button
          type="button"
          onClick={() => void handleShare()}
          disabled={sharePending}
          aria-label={`Bagikan laporan. ${shares} kali dibagikan`}
          className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
        >
          {sharePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          {shares}
        </button>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between border-t border-border/60 px-4 py-2 sm:px-5">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {isLocalReport ? (
              <>
                <HardDrive className="size-3.5" /> Tersimpan lokal
              </>
            ) : (
              <>
                <BookOpenCheck className="size-3.5" />
                {isIntegratedRecord
                  ? `${report.source_links?.length ?? 0} sumber terverifikasi`
                  : "Data referensi"}
              </>
            )}
          </span>
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={sharePending}
            aria-label={`Bagikan ${isLocalReport ? "laporan perangkat ini" : "catatan sumber publik"}`}
            aria-busy={sharePending}
            className="flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
          >
            {sharePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            Bagikan
          </button>
        </div>
      )}

      {hasServerInteractions && commentsOpen && (
        <div id={`comments-${report.id}`} className="border-t bg-secondary/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Diskusi warga
          </p>
          {commentsLoading ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat komentar…
            </p>
          ) : comments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {comments.map((item) => (
                <div key={item.id} className="rounded-lg border bg-card px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{item.author}</span>
                    <time className="text-[11px] text-muted-foreground" dateTime={item.created_at}>
                      {formatDate(item.created_at)} WIB
                    </time>
                  </div>
                  <p className="mt-1 break-words text-muted-foreground">{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Belum ada komentar. Mulai diskusi.</p>
          )}

          <form onSubmit={handleComment} className="mt-3 flex gap-2">
            <Input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              placeholder="Tulis komentar yang membantu…"
              aria-label="Komentar"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!comment.trim() || commentPending}
              aria-label="Kirim komentar"
            >
              {commentPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}
    </Card>
  )
}
