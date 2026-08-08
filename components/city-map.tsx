"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type {
  LayerGroup as LeafletLayerGroup,
  Map as LeafletMap,
  Marker as LeafletMarker,
  TileLayer as LeafletTileLayer,
} from "leaflet"
import {
  AlertTriangle,
  ExternalLink,
  LocateFixed,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CATEGORIES, getCategory, STATUS_META } from "@/lib/categories"
import {
  isWithinSurabaya,
  SURABAYA_BOUNDARY,
  SURABAYA_BOUNDS,
  SURABAYA_CENTER,
} from "@/lib/surabaya-geo"
import type { Incident } from "@/lib/types"

const POLL_INTERVAL_MS = 10_000

function createPopupContent(incident: Incident, locationName = incident.area) {
  const category = getCategory(incident.category)
  const root = document.createElement("div")
  root.className = "subalap-map-popup"

  const categoryLabel = document.createElement("p")
  categoryLabel.textContent = `${category.label} · ${locationName}`
  categoryLabel.style.color = category.color
  categoryLabel.className = "subalap-map-popup-category"

  const title = document.createElement("strong")
  title.textContent = incident.title

  const summary = document.createElement("p")
  summary.textContent = incident.ai_summary ?? "Belum ada ringkasan."
  summary.className = "subalap-map-popup-summary"

  const stats = document.createElement("p")
  stats.textContent = `${incident.report_count} catatan · urgensi ${incident.avg_severity}/100`
  stats.className = "subalap-map-popup-stats"

  root.append(categoryLabel, title, summary, stats)
  return root
}

export function CityMap({
  initialIncidents,
  initialCategory = "all",
  liveMode = true,
}: {
  initialIncidents: Incident[]
  initialCategory?: string
  liveMode?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const mapElementRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<typeof import("leaflet") | null>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const incidentLayerRef = useRef<LeafletLayerGroup | null>(null)
  const locationLayerRef = useRef<LeafletLayerGroup | null>(null)
  const tileLayerRef = useRef<LeafletTileLayer | null>(null)
  const tileErrorCountRef = useRef(0)
  const syncingRef = useRef(false)
  const markerByIdRef = useRef(new Map<number, LeafletMarker>())

  const [incidents, setIncidents] = useState(
    initialIncidents.filter((incident) => isWithinSurabaya(incident.lat, incident.lng)),
  )
  const [category, setCategory] = useState(initialCategory)
  const [selectedId, setSelectedId] = useState(initialIncidents[0]?.id)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState("")
  const [tileWarning, setTileWarning] = useState("")
  const [syncError, setSyncError] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [locating, setLocating] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationMessage, setLocationMessage] = useState("")

  const visibleIncidents = useMemo(
    () =>
      category === "all"
        ? incidents
        : incidents.filter((incident) => incident.category === category),
    [category, incidents],
  )
  const visibleLocationCount = useMemo(
    () =>
      visibleIncidents.reduce(
        (count, incident) =>
          count +
          Math.max(
            1,
            incident.location_points?.filter((location) =>
              isWithinSurabaya(location.lat, location.lng),
            ).length ?? 0,
          ),
        0,
      ),
    [visibleIncidents],
  )
  const selected = useMemo(
    () => visibleIncidents.find((incident) => incident.id === selectedId) ?? visibleIncidents[0],
    [selectedId, visibleIncidents],
  )

  const refreshIncidents = useCallback(async () => {
    if (syncingRef.current) return
    syncingRef.current = true
    setSyncing(true)
    try {
      const response = await fetch("/api/incidents", { cache: "no-store" })
      if (!response.ok) throw new Error("Sinkronisasi gagal.")
      const latest = (await response.json()) as Incident[]
      setIncidents(latest.filter((incident) => isWithinSurabaya(incident.lat, incident.lng)))
      setLastSync(new Date())
      setSyncError(false)
    } catch {
      setSyncError(true)
    } finally {
      syncingRef.current = false
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    setCategory(initialCategory)
  }, [initialCategory])

  useEffect(() => {
    setLastSync(new Date())
    if (!liveMode) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshIncidents()
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [liveMode, refreshIncidents])

  useEffect(() => {
    if (!mapElementRef.current) return
    let cancelled = false
    let map: LeafletMap | null = null
    let resizeObserver: ResizeObserver | null = null

    void import("leaflet")
      .then((leaflet) => {
        if (cancelled || !mapElementRef.current) return

        leafletRef.current = leaflet
        map = leaflet.map(mapElementRef.current, {
          center: [SURABAYA_CENTER.lat, SURABAYA_CENTER.lng],
          zoom: 12,
          minZoom: 11,
          maxBounds: [
            [SURABAYA_BOUNDS.south, SURABAYA_BOUNDS.west],
            [SURABAYA_BOUNDS.north, SURABAYA_BOUNDS.east],
          ],
          maxBoundsViscosity: 1,
          scrollWheelZoom: true,
          zoomControl: false,
          attributionControl: true,
        })

        const tileLayer = leaflet
          .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          })
          .on("tileload", () => {
            tileErrorCountRef.current = 0
            setTileWarning("")
          })
          .on("tileerror", () => {
            tileErrorCountRef.current += 1
            if (tileErrorCountRef.current >= 3) {
              setTileWarning("Sebagian tile OpenStreetMap gagal dimuat.")
            }
          })
          .addTo(map)

        tileLayerRef.current = tileLayer
        leaflet.control.zoom({ position: "bottomright" }).addTo(map)

        const boundary = SURABAYA_BOUNDARY.map(
          ([lat, lng]) => [lat, lng] as [number, number],
        )
        const world = [
          [-90, -180],
          [-90, 180],
          [90, 180],
          [90, -180],
        ] as [number, number][]

        leaflet
          .polygon([world, boundary], {
            stroke: false,
            fillColor: "#071019",
            fillOpacity: 0.38,
            fillRule: "evenodd",
            interactive: false,
          })
          .addTo(map)

        const boundaryLayer = leaflet
          .polygon(boundary, {
            color: "#14b8a6",
            weight: 2,
            dashArray: "7 7",
            fillColor: "#14b8a6",
            fillOpacity: 0.025,
            interactive: false,
          })
          .addTo(map)

        map.fitBounds(boundaryLayer.getBounds(), { padding: [18, 18] })
        incidentLayerRef.current = leaflet.layerGroup().addTo(map)
        locationLayerRef.current = leaflet.layerGroup().addTo(map)
        mapInstanceRef.current = map
        setMapReady(true)

        resizeObserver = new ResizeObserver(() => {
          map?.invalidateSize({ pan: false, debounceMoveend: true })
        })
        resizeObserver.observe(mapElementRef.current)
        window.setTimeout(() => map?.invalidateSize({ pan: false }), 0)
      })
      .catch(() => {
        setMapError("OpenStreetMap gagal dimuat. Periksa koneksi internet lalu muat ulang.")
      })

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      map?.remove()
      mapInstanceRef.current = null
      incidentLayerRef.current = null
      locationLayerRef.current = null
      tileLayerRef.current = null
      tileErrorCountRef.current = 0
      markerByIdRef.current.clear()
    }
  }, [])

  useEffect(() => {
    const leaflet = leafletRef.current
    const layer = incidentLayerRef.current
    if (!mapReady || !leaflet || !layer) return

    layer.clearLayers()
    markerByIdRef.current.clear()

    visibleIncidents.forEach((incident) => {
      const categoryMeta = getCategory(incident.category)
      const isActive = selected?.id === incident.id
      const locations =
        incident.location_points && incident.location_points.length > 0
          ? incident.location_points.filter((location) =>
              isWithinSurabaya(location.lat, location.lng),
            )
          : [
              {
                name: incident.area,
                address: incident.area,
                lat: incident.lat,
                lng: incident.lng,
                precision: "titik_utama",
                accuracy_m: null,
              },
            ]

      locations.forEach((location, locationIndex) => {
        const markerIcon = leaflet.divIcon({
          className: "subalap-map-marker",
          html: `<span class="subalap-map-pin${isActive ? " is-active" : ""}" style="--pin-color:${categoryMeta.color}"><span>${incident.report_count}</span></span>`,
          iconSize: [44, 50],
          iconAnchor: [22, 46],
          popupAnchor: [0, -44],
        })

        const marker = leaflet
          .marker([location.lat, location.lng], {
            icon: markerIcon,
            title: `${incident.title}, ${location.name}`,
            alt: `Marker ${incident.title} di ${location.name}`,
            riseOnHover: true,
            zIndexOffset: isActive ? 1000 : incident.impact_score,
          })
          .bindPopup(createPopupContent(incident, location.name), {
            closeButton: true,
            maxWidth: 280,
          })
          .on("click", () => setSelectedId(incident.id))
          .addTo(layer)

        if (locationIndex === 0) markerByIdRef.current.set(incident.id, marker)
      })
    })
  }, [mapReady, selected?.id, visibleIncidents])

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id)
  }, [selected, selectedId])

  function focusIncident(incident: Incident) {
    setSelectedId(incident.id)
    const map = mapInstanceRef.current
    if (!map) return
    map.flyTo([incident.lat, incident.lng], 15, { duration: 0.75 })
    window.setTimeout(() => markerByIdRef.current.get(incident.id)?.openPopup(), 450)
  }

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory)
    const params = new URLSearchParams(searchParams.toString())
    if (nextCategory === "all") params.delete("category")
    else params.set("category", nextCategory)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function locateUser() {
    if (!navigator.geolocation) {
      setLocationMessage("Browser tidak mendukung lokasi perangkat.")
      return
    }

    setLocating(true)
    setLocationMessage("Mencari lokasi perangkat…")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setLocating(false)

        if (!isWithinSurabaya(location.lat, location.lng)) {
          setUserLocation(null)
          setLocationMessage("Lokasi Anda di luar Kota Surabaya. Peta tetap terkunci pada batas kota.")
          locationLayerRef.current?.clearLayers()
          return
        }

        setUserLocation(location)
        setLocationMessage(
          `Lokasi ditemukan di Surabaya · akurasi ±${Math.round(position.coords.accuracy)} m`,
        )

        const leaflet = leafletRef.current
        const map = mapInstanceRef.current
        const layer = locationLayerRef.current
        if (!leaflet || !map || !layer) return

        layer.clearLayers()
        leaflet
          .circle([location.lat, location.lng], {
            radius: position.coords.accuracy,
            color: "#0b9fab",
            fillColor: "#22d3d8",
            fillOpacity: 0.12,
            weight: 1,
          })
          .addTo(layer)
        leaflet
          .circleMarker([location.lat, location.lng], {
            radius: 8,
            color: "#ffffff",
            fillColor: "#0b9fab",
            fillOpacity: 1,
            weight: 3,
          })
          .bindPopup("Lokasi Anda")
          .addTo(layer)
          .openPopup()
        map.flyTo([location.lat, location.lng], 15, { duration: 0.8 })
      },
      () => {
        setLocating(false)
        setLocationMessage("Lokasi gagal dibaca. Izinkan akses lokasi lalu coba lagi.")
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    )
  }

  function retryMapTiles() {
    tileErrorCountRef.current = 0
    setTileWarning("")
    mapInstanceRef.current?.invalidateSize({ pan: false })
    tileLayerRef.current?.redraw()
  }

  const openStreetMapUrl = selected
    ? `https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lng}#map=16/${selected.lat}/${selected.lng}`
    : "https://www.openstreetmap.org/#map=12/-7.2575/112.7521"

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex shrink-0 flex-col justify-between gap-2 rounded-xl border bg-card px-3 py-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
              syncError ? "text-amber-500" : "text-emerald-500"
            }`}
          >
            <span className="relative flex size-2.5">
              {!syncError && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex size-2.5 rounded-full ${
                  syncError ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
            </span>
            {syncError
              ? "Data tersimpan"
              : liveMode
                ? "Data kondisi live"
                : "Data terintegrasi"}
          </span>
          <span className="text-xs text-muted-foreground">
            {syncError
              ? "Sinkronisasi gagal · menampilkan data terakhir"
              : liveMode
                ? `${visibleLocationCount} titik · diperbarui otomatis 10 dtk · ${
                    lastSync
                      ? lastSync.toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "menunggu sinkronisasi"
                  }`
                : `${visibleLocationCount} titik dari ${incidents.length} isu terverifikasi`}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            render={
              <a
                href={openStreetMapUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Buka lokasi terpilih di OpenStreetMap"
              />
            }
            nativeButton={false}
            type="button"
            variant="outline"
            size="sm"
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">Buka OSM</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refreshIncidents()}
            disabled={syncing}
          >
            <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
            Perbarui
          </Button>
          <Button type="button" size="sm" onClick={locateUser} disabled={locating || !mapReady}>
            {locating ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <LocateFixed className="size-3.5" />
            )}
            Lokasi Saya
          </Button>
        </div>
      </div>

      {locationMessage && (
        <p
          className="mb-2 flex shrink-0 items-center gap-2 text-xs text-muted-foreground"
          aria-live="polite"
        >
          <LocateFixed className="size-3.5 text-primary" />
          {locationMessage}
          {userLocation && ` · ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`}
        </p>
      )}

      <div
        className="mb-2 flex shrink-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Filter kategori"
      >
        <button
          type="button"
          onClick={() => selectCategory("all")}
          aria-pressed={category === "all"}
          className={`min-h-9 shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
            category === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          Semua
        </button>
        {CATEGORIES.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => selectCategory(item.key)}
            aria-pressed={category === item.key}
            className={`min-h-9 shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
              category === item.key
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="relative min-h-[320px] overflow-hidden border-primary/20 p-0">
          <div
            ref={mapElementRef}
            className="absolute inset-0 z-0"
            role="region"
            tabIndex={0}
            aria-label="Peta interaktif kondisi Surabaya"
          />

          {!mapReady && !mapError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="size-4 animate-spin text-primary" />
                Memuat OpenStreetMap…
              </span>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary p-6 text-center">
              <div>
                <AlertTriangle className="mx-auto size-6 text-amber-500" />
                <p className="mt-2 font-semibold">Peta gagal dimuat</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">{mapError}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="size-3.5" />
                  Muat ulang
                </Button>
              </div>
            </div>
          )}

          {tileWarning && !mapError && (
            <div className="absolute bottom-10 left-3 z-[500] flex max-w-[calc(100%-5.5rem)] items-center gap-2 rounded-lg border border-amber-500/30 bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
              <AlertTriangle className="size-4 shrink-0 text-amber-500" />
              <span className="text-muted-foreground">{tileWarning}</span>
              <button
                type="button"
                onClick={retryMapTiles}
                className="font-semibold text-primary hover:underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-lg border bg-background/90 px-3 py-2 shadow-sm backdrop-blur">
            <MapPin className="size-4 text-primary" />
            <span className="text-xs font-semibold">{visibleLocationCount} titik kondisi</span>
          </div>
          <div className="pointer-events-none absolute right-3 top-3 z-[500] hidden rounded-lg border bg-background/90 px-3 py-2 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur sm:block">
            OpenStreetMap · batas Surabaya
          </div>

          {selected && (
            <div className="pointer-events-none absolute bottom-3 left-3 z-[500] max-w-[calc(100%-5.5rem)] rounded-lg border bg-background/92 px-3 py-2 shadow-sm backdrop-blur lg:hidden">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                Catatan kondisi
              </p>
              <p className="truncate text-xs font-semibold">{selected.title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {selected.area} · urgensi {selected.avg_severity}/100
              </p>
            </div>
          )}
        </Card>

        <div className="hidden min-h-0 flex-col gap-3 lg:flex">
          {selected && (
            <Card className="shrink-0 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-primary">#{selected.hashtag}</p>
                  <h2 className="mt-1 font-display text-lg font-bold">{selected.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.area}, Surabaya</p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    color:
                      selected.origin === "integrated_source"
                        ? "#22c55e"
                        : STATUS_META[selected.status].color,
                    backgroundColor:
                      selected.origin === "integrated_source"
                        ? "#22c55e18"
                        : `${STATUS_META[selected.status].color}18`,
                  }}
                >
                  {selected.origin === "integrated_source"
                    ? "Terverifikasi"
                    : STATUS_META[selected.status].label}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-secondary p-2.5">
                  <p className="font-display text-xl font-bold">{selected.report_count}</p>
                  <p className="text-xs text-muted-foreground">Catatan</p>
                </div>
                <div className="rounded-lg bg-secondary p-2.5">
                  <p className="font-display text-xl font-bold">{selected.avg_severity}/100</p>
                  <p className="text-xs text-muted-foreground">Urgensi</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <ShieldCheck className="size-4 text-primary" />
                Skor verifikasi {selected.avg_verification}%
              </div>
              <p className="mt-3 line-clamp-3 rounded-lg border bg-card p-2.5 text-xs leading-relaxed text-muted-foreground">
                {selected.ai_summary}
              </p>
            </Card>
          )}

          <Card className="min-h-0 flex-1 overflow-y-auto p-3">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data di peta
            </p>
            <div className="space-y-1">
              {visibleIncidents.map((incident) => {
                const categoryMeta = getCategory(incident.category)
                return (
                  <button
                    key={incident.id}
                    type="button"
                    onClick={() => focusIncident(incident)}
                    aria-pressed={selected?.id === incident.id}
                    className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors ${
                      selected?.id === incident.id ? "bg-secondary" : "hover:bg-secondary/60"
                    }`}
                  >
                    <MapPin
                      className="mt-0.5 size-4 shrink-0"
                      style={{ color: categoryMeta.color }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{incident.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {incident.area} · {incident.report_count} catatan
                      </span>
                    </span>
                  </button>
                )
              })}
              {visibleIncidents.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Belum ada data pada kategori ini.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
