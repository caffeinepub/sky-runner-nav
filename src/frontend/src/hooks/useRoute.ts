import { useCallback, useState } from "react";
import type { RouteInfo, Waypoint } from "../types";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

export function useRoute() {
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = useCallback(async (waypoints: Waypoint[]) => {
    if (waypoints.length < 2) {
      setRoute(null);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(";");
      const url = `${OSRM_URL}/${coords}?overview=full&geometries=geojson`;
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
  }, []);

  const clearRoute = useCallback(() => setRoute(null), []);

  return { route, loading, error, calculateRoute, clearRoute };
}
