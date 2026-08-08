export const SURABAYA_CENTER = { lat: -7.2575, lng: 112.7521 } as const

export const SURABAYA_BOUNDS = {
  south: -7.365,
  west: 112.605,
  north: -7.17,
  east: 112.865,
} as const

// Simplified municipal boundary for product geofencing and map framing.
// Server and client share this polygon, preventing different validation results.
export const SURABAYA_BOUNDARY: readonly (readonly [number, number])[] = [
  [-7.239, 112.608],
  [-7.204, 112.618],
  [-7.174, 112.666],
  [-7.171, 112.735],
  [-7.187, 112.797],
  [-7.221, 112.843],
  [-7.271, 112.863],
  [-7.321, 112.854],
  [-7.361, 112.812],
  [-7.363, 112.755],
  [-7.346, 112.701],
  [-7.311, 112.648],
  [-7.273, 112.619],
] as const

export function isWithinSurabaya(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (
    lat < SURABAYA_BOUNDS.south ||
    lat > SURABAYA_BOUNDS.north ||
    lng < SURABAYA_BOUNDS.west ||
    lng > SURABAYA_BOUNDS.east
  ) {
    return false
  }

  let inside = false
  for (
    let current = 0, previous = SURABAYA_BOUNDARY.length - 1;
    current < SURABAYA_BOUNDARY.length;
    previous = current++
  ) {
    const [currentLat, currentLng] = SURABAYA_BOUNDARY[current]
    const [previousLat, previousLng] = SURABAYA_BOUNDARY[previous]
    const crossesRay =
      currentLng > lng !== previousLng > lng &&
      lat <
        ((previousLat - currentLat) * (lng - currentLng)) /
          (previousLng - currentLng) +
          currentLat
    if (crossesRay) inside = !inside
  }
  return inside
}
