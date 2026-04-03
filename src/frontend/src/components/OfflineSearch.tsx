import { MapPin, Navigation, Search, WifiOff } from "lucide-react";
import { useCallback, useState } from "react";
import type { SavedDestinationLocal, XutionBuilding } from "../types";
import { getAllCachedOverlayNodes } from "../utils/overlayCache";

interface SearchResult {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  source: "overlay" | "saved" | "xution";
}

interface OfflineSearchProps {
  onFlyTo: (lat: number, lng: number) => void;
  onAddAsWaypoint: (lat: number, lng: number, name: string) => void;
  xutionBuildings: XutionBuilding[];
}

export function OfflineSearch({
  onFlyTo,
  onAddAsWaypoint,
  xutionBuildings,
}: OfflineSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const search = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      const lq = q.toLowerCase();
      const found: SearchResult[] = [];

      // 1. Search cached overlay places
      const cachedNodes = getAllCachedOverlayNodes();
      for (const { node, overlayId } of cachedNodes) {
        const name = node.tags?.name ?? "";
        const street = node.tags?.["addr:street"] ?? "";
        const amenity =
          node.tags?.amenity ?? node.tags?.shop ?? node.tags?.tourism ?? "";
        const city = node.tags?.["addr:city"] ?? "";
        const combined = `${name} ${street} ${amenity} ${city}`.toLowerCase();
        if (!combined.includes(lq)) continue;
        const lat = node.lat ?? node.center?.lat;
        const lng = node.lon ?? node.center?.lon;
        if (lat === undefined || lng === undefined) continue;
        found.push({
          id: `overlay-${node.id}`,
          name: name || amenity || overlayId,
          type: amenity || overlayId,
          lat,
          lng,
          source: "overlay",
        });
        if (found.length >= 30) break;
      }

      // 2. Search saved places
      try {
        const raw = localStorage.getItem("skyrunner-saved-places");
        if (raw) {
          const saved: SavedDestinationLocal[] = JSON.parse(raw);
          for (const place of saved) {
            if (!place.name.toLowerCase().includes(lq)) continue;
            found.push({
              id: `saved-${place.id}`,
              name: place.name,
              type: "Saved Place",
              lat: place.lat,
              lng: place.lng,
              source: "saved",
            });
          }
        }
      } catch {
        // ignore
      }

      // 3. Search xution buildings
      for (const b of xutionBuildings) {
        const combined = `${b.name} ${b.category} ${b.notes}`.toLowerCase();
        if (!combined.includes(lq)) continue;
        found.push({
          id: `xution-${b.id}`,
          name: b.name,
          type: `Xution ${b.category}`,
          lat: b.lat,
          lng: b.lng,
          source: "xution",
        });
      }

      setResults(found.slice(0, 20));
    },
    [xutionBuildings],
  );

  const handleInput = (val: string) => {
    setQuery(val);
    search(val);
  };

  const sourceIcon = (source: SearchResult["source"]) => {
    if (source === "xution") return "🏛";
    if (source === "saved") return "⭐";
    return "📍";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 mb-1">
        <WifiOff size={10} className="text-amber-400" />
        <p className="text-[10px] text-amber-400 tracking-wider font-bold">
          OFFLINE SEARCH
        </p>
      </div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Search cached places, waypoints..."
          className="w-full bg-[#0e0e0f] border border-[#2F2F34] text-[#E7E7EA] text-xs px-3 py-2 pr-8 font-mono placeholder-[#A7A7AD] focus:outline-none focus:border-amber-500/60 transition-colors"
          data-ocid="offline_search.input"
        />
        <Search
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A7A7AD]"
        />
      </div>

      {results.length > 0 && (
        <div className="border border-[#2F2F34] bg-[#0e0e0f] divide-y divide-[#2F2F34] max-h-48 overflow-y-auto">
          {results.map((r) => (
            <div
              key={r.id}
              className="px-2 py-2 hover:bg-[#1A1819] transition-colors"
            >
              <div className="flex items-start justify-between gap-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#E7E7EA] font-mono truncate">
                    {sourceIcon(r.source)} {r.name}
                  </p>
                  <p className="text-[10px] text-[#A7A7AD] mt-0.5">
                    {r.type} · {r.lat.toFixed(4)},{r.lng.toFixed(4)}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onFlyTo(r.lat, r.lng)}
                    className="px-1.5 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-bold tracking-wider hover:bg-[#D4AF37]/20 transition-colors"
                    title="Fly to location"
                    data-ocid="offline_search.secondary_button"
                  >
                    <MapPin size={9} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddAsWaypoint(r.lat, r.lng, r.name)}
                    className="px-1.5 py-1 bg-[#0e0e0f] border border-[#2F2F34] text-[#A7A7AD] text-[9px] font-bold tracking-wider hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors"
                    title="Add as waypoint"
                    data-ocid="offline_search.primary_button"
                  >
                    <Navigation size={9} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {query.trim() && results.length === 0 && (
        <p
          className="text-[10px] text-[#A7A7AD] py-1"
          data-ocid="offline_search.empty_state"
        >
          No cached results. Toggle overlays online to cache places.
        </p>
      )}
    </div>
  );
}
