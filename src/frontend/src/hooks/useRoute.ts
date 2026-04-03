import { useCallback, useState } from "react";
import type { RouteInfo, Waypoint } from "../types";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

type TravelMode = "driving" | "flying" | "teleport";

function haversineKm(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const R = 6371;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

async function findNearestForest(
  lat: number,
  lng: number,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = `[out:json][timeout:10];
(
  way[landuse=forest](around:50000,${lat},${lng});
  way[natural=wood](around:50000,${lat},${lng});
  relation[landuse=forest](around:50000,${lat},${lng});
);
out center 1;`;
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.elements && data.elements.length > 0) {
      const el = data.elements[0];
      const elLat = el.center?.lat ?? el.lat;
      const elLng = el.center?.lon ?? el.lon;
      if (elLat && elLng) return { lat: elLat, lng: elLng };
    }
  } catch {
    // silently fall back to straight-line point
  }
  return null;
}

async function buildForestPrioritizedRoute(
  waypoints: Waypoint[],
): Promise<RouteInfo> {
  const coords = waypoints.map((w) => [w.lng, w.lat] as [number, number]);

  // Calculate total straight-line distance
  let totalDistM = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    totalDistM += haversineKm(coords[i], coords[i + 1]) * 1000;
  }

  // Build geometry biased toward forests
  const forestCoords: [number, number][] = [];

  for (let seg = 0; seg < coords.length - 1; seg++) {
    const [lng1, lat1] = coords[seg];
    const [lng2, lat2] = coords[seg + 1];
    forestCoords.push([lng1, lat1]);

    const segDistKm = haversineKm([lng1, lat1], [lng2, lat2]);
    const numSamples = Math.max(1, Math.floor(segDistKm / 100));

    // Sample intermediate points and nudge toward forests
    const forestPromises: Promise<[number, number]>[] = [];
    for (let i = 1; i < numSamples; i++) {
      const t = i / numSamples;
      const midLat = lat1 + (lat2 - lat1) * t;
      const midLng = lng1 + (lng2 - lng1) * t;
      forestPromises.push(
        findNearestForest(midLat, midLng).then((forest) =>
          forest ? [forest.lng, forest.lat] : [midLng, midLat],
        ),
      );
    }

    const resolved = await Promise.all(forestPromises);
    forestCoords.push(...resolved);
  }
  forestCoords.push(coords[coords.length - 1]);

  return {
    distance: totalDistM,
    duration: totalDistM / 250, // ~900 km/h cruise speed
    geometry: { type: "LineString", coordinates: forestCoords },
  };
}

export function useRoute() {
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = useCallback(
    async (waypoints: Waypoint[], mode: TravelMode = "driving") => {
      if (waypoints.length < 2) {
        setRoute(null);
        return null;
      }

      // Flying mode: straight-line over terrain, biased toward forests
      if (mode === "flying") {
        setLoading(true);
        setError(null);
        try {
          const info = await buildForestPrioritizedRoute(waypoints);
          setRoute(info);
          return info;
        } catch {
          // Fallback: plain straight line if forest queries fail
          const coords = waypoints.map(
            (w) => [w.lng, w.lat] as [number, number],
          );
          let totalDistM = 0;
          for (let i = 0; i < coords.length - 1; i++) {
            totalDistM += haversineKm(coords[i], coords[i + 1]) * 1000;
          }
          const info: RouteInfo = {
            distance: totalDistM,
            duration: totalDistM / 250,
            geometry: { type: "LineString", coordinates: coords },
          };
          setRoute(info);
          return info;
        } finally {
          setLoading(false);
        }
      }

      setLoading(true);
      setError(null);

      try {
        const coordStr = waypoints.map((w) => `${w.lng},${w.lat}`).join(";");
        const url = `${OSRM_URL}/${coordStr}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`OSRM error: ${res.status}`);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          const info: RouteInfo = {
            distance: r.distance,
            duration: r.duration,
            geometry: r.geometry,
          };
          setRoute(info);
          return info;
        }
        throw new Error("No route found");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Route calculation failed");
        setRoute(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearRoute = useCallback(() => setRoute(null), []);

  return { route, loading, error, calculateRoute, clearRoute };
}
