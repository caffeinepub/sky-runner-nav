import { useCallback, useState } from "react";
import type { OverpassNode } from "../types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export function useOverpass() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNodes = useCallback(
    async (
      query: string,
      bbox: [number, number, number, number],
    ): Promise<OverpassNode[]> => {
      setLoading(true);
      setError(null);
      try {
        const bboxStr = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
        // Use replaceAll so union queries with multiple {{bbox}} tokens all get replaced
        const fullQuery = `[out:json][timeout:25];${query.replaceAll("{{bbox}}", bboxStr)};out center;`;
        const res = await fetch(OVERPASS_URL, {
          method: "POST",
          body: `data=${encodeURIComponent(fullQuery)}`,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
        const data = await res.json();
        const elements: OverpassNode[] = (data.elements || [])
          .map((el: OverpassNode) => {
            if ((el.type === "way" || el.type === "relation") && el.center) {
              return { ...el, lat: el.center.lat, lon: el.center.lon };
            }
            return el;
          })
          .filter(
            (el: OverpassNode) => el.lat !== undefined && el.lon !== undefined,
          );
        return elements;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchSpeedLimits = useCallback(
    async (
      bbox: [number, number, number, number],
    ): Promise<{ speed: string; count: number }[]> => {
      setLoading(true);
      try {
        const bboxStr = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
        const query = `[out:json][timeout:10];way[maxspeed](${bboxStr});out body;`;
        const res = await fetch(OVERPASS_URL, {
          method: "POST",
          body: `data=${encodeURIComponent(query)}`,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        if (!res.ok) return [];
        const data = await res.json();
        const counts: Record<string, number> = {};
        for (const el of data.elements || []) {
          const speed = el.tags?.maxspeed;
          if (speed) counts[speed] = (counts[speed] || 0) + 1;
        }
        return Object.entries(counts)
          .map(([speed, count]) => ({ speed, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      } catch {
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { fetchNodes, fetchSpeedLimits, loading, error };
}
