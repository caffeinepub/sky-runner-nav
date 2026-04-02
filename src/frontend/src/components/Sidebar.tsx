import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  MapPin,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import type { GeoPosition } from "../hooks/useGeolocation";
import type {
  OverlayType,
  SavedDestinationLocal,
  SpeedLimit,
  TravelMode,
  Waypoint,
} from "../types";
import { Checklist } from "./Checklist";
import { OverlayControls } from "./OverlayControls";
import { SavedPlaces } from "./SavedPlaces";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mode: TravelMode;
  waypoints: Waypoint[];
  onWaypointsChange: (waypoints: Waypoint[]) => void;
  overlays: OverlayType[];
  onToggleOverlay: (id: string) => void;
  staticOverlays: { id: string; label: string; active: boolean }[];
  onToggleStatic: (id: string) => void;
  speedLimits: SpeedLimit[];
  onFlyTo: (lat: number, lng: number) => void;
  onLoadDestination: (dest: SavedDestinationLocal) => void;
  routeDistance: number | null;
  routeDuration: number | null;
  position: GeoPosition | null;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function Sidebar({
  collapsed,
  onToggle,
  mode,
  waypoints,
  onWaypointsChange,
  overlays,
  onToggleOverlay,
  staticOverlays,
  onToggleStatic,
  speedLimits,
  onFlyTo,
  onLoadDestination,
  routeDistance,
  routeDuration,
  position,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { "Accept-Language": "en" } },
      );
      const data: NominatimResult[] = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchAddress(val), 400);
  };

  const addWaypoint = (result: NominatimResult) => {
    const wp: Waypoint = {
      id: `wp-${Date.now()}`,
      name: result.display_name.split(",").slice(0, 2).join(","),
      lat: Number.parseFloat(result.lat),
      lng: Number.parseFloat(result.lon),
    };
    onWaypointsChange([...waypoints, wp]);
    setSearchQuery("");
    setSearchResults([]);
    onFlyTo(wp.lat, wp.lng);
  };

  const removeWaypoint = (id: string) => {
    onWaypointsChange(waypoints.filter((w) => w.id !== id));
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...waypoints];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);
    onWaypointsChange(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <aside
      className={`flex-shrink-0 bg-[#1A1819] border-r border-[#2F2F34] flex flex-col overflow-hidden transition-[width] duration-200 ${
        collapsed ? "w-10" : "w-80"
      }`}
      data-ocid="sidebar.panel"
    >
      {/* Collapsed strip */}
      {collapsed ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-col items-center w-full h-full cursor-pointer py-3 gap-3 hover:bg-[#D4AF37]/5 transition-colors group"
          title="Expand sidebar"
          data-ocid="sidebar.toggle"
        >
          <div className="w-8 h-8 flex items-center justify-center text-[#A7A7AD] group-hover:text-[#D4AF37] border border-[#2F2F34] group-hover:border-[#D4AF37] transition-colors flex-shrink-0">
            <ChevronRight size={14} />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span
              className="text-[#A7A7AD] text-[9px] tracking-[0.25em] uppercase select-none group-hover:text-[#D4AF37] transition-colors"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              SKY-RUNNER
            </span>
          </div>
        </button>
      ) : (
        <>
          {/* Expanded header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2F2F34] flex-shrink-0">
            <span className="text-xs text-[#D4AF37] font-bold tracking-wider">
              NAVIGATION
            </span>
            <button
              type="button"
              onClick={onToggle}
              className="w-7 h-7 flex items-center justify-center text-[#A7A7AD] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 border border-transparent hover:border-[#D4AF37]/30 transition-colors"
              title="Collapse sidebar"
              data-ocid="sidebar.toggle"
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* Current Location */}
              {position && (
                <div className="bg-[#0e0e0f] border border-[#D4AF37]/40 p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin
                      size={10}
                      className="text-[#D4AF37] flex-shrink-0"
                    />
                    <p className="text-[10px] text-[#D4AF37] tracking-wider font-bold">
                      CURRENT LOCATION
                    </p>
                  </div>
                  <p className="text-xs text-[#E7E7EA] font-mono">
                    {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                  </p>
                  {position.accuracy !== undefined && (
                    <p className="text-[10px] text-[#A7A7AD]">
                      Accuracy: ±{Math.round(position.accuracy)}m
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onFlyTo(position.lat, position.lng)}
                    className="w-full py-1 border border-[#D4AF37]/50 text-[#D4AF37] text-[10px] hover:bg-[#D4AF37]/10 transition-colors tracking-wider"
                    data-ocid="location.primary_button"
                  >
                    CENTER MAP HERE
                  </button>
                </div>
              )}

              {/* Search */}
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      placeholder="Search address..."
                      className="w-full bg-[#0e0e0f] border border-[#2F2F34] text-[#E7E7EA] text-xs px-3 py-2 pr-8 font-mono placeholder-[#A7A7AD] focus:outline-none focus:border-[#D4AF37] transition-colors"
                      data-ocid="search.input"
                    />
                    {searching && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#D4AF37] text-xs animate-pulse">
                        …
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => searchAddress(searchQuery)}
                    className="px-3 py-2 bg-[#D4AF37] text-[#020202] hover:bg-[#c49f2f] transition-colors"
                    data-ocid="search.primary_button"
                  >
                    <Search size={13} />
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="border border-[#2F2F34] bg-[#0e0e0f] divide-y divide-[#2F2F34]">
                    {searchResults.map((r) => (
                      <button
                        key={r.place_id}
                        type="button"
                        onClick={() => addWaypoint(r)}
                        className="w-full text-left px-3 py-2 text-xs text-[#E7E7EA] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors font-mono"
                      >
                        <span className="line-clamp-2">{r.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Route Info */}
              {waypoints.length >= 2 &&
                (routeDistance !== null || routeDuration !== null) && (
                  <div className="bg-[#0e0e0f] border border-[#2F2F34] p-2 space-y-1">
                    <p className="text-[10px] text-[#A7A7AD] tracking-wider">
                      CURRENT ROUTE
                    </p>
                    {routeDistance !== null && (
                      <p className="text-xs text-[#D4AF37] font-bold">
                        {formatDistance(routeDistance)} ·{" "}
                        {routeDuration !== null
                          ? formatDuration(routeDuration)
                          : ""}
                      </p>
                    )}
                    <p className="text-xs text-[#E7E7EA] break-words">
                      {waypoints[0].name} →{" "}
                      {waypoints[waypoints.length - 1].name}
                    </p>
                  </div>
                )}

              {/* Waypoints */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-[#A7A7AD] tracking-wider">
                    WAYPOINTS
                  </p>
                  <span className="text-[10px] text-[#A7A7AD]">
                    {waypoints.length}
                  </span>
                </div>
                {waypoints.length === 0 && (
                  <p
                    className="text-xs text-[#A7A7AD] py-1"
                    data-ocid="waypoints.empty_state"
                  >
                    Search and add destinations above.
                  </p>
                )}
                <div className="space-y-1">
                  {waypoints.map((wp, index) => (
                    <div
                      key={wp.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-start gap-2 p-2 bg-[#0e0e0f] border transition-colors ${
                        dragOverIndex === index
                          ? "border-[#D4AF37]"
                          : "border-[#2F2F34]"
                      }`}
                      data-ocid={`waypoints.item.${index + 1}`}
                    >
                      <GripVertical
                        size={12}
                        className="text-[#A7A7AD] cursor-grab flex-shrink-0 mt-0.5"
                        data-ocid={`waypoints.drag_handle.${index + 1}`}
                      />
                      <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center border border-[#D4AF37] text-[#D4AF37] text-[10px] font-bold mt-0.5">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-xs text-[#E7E7EA] break-words min-w-0">
                        {wp.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeWaypoint(wp.id)}
                        className="text-[#A7A7AD] hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                        data-ocid={`waypoints.delete_button.${index + 1}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                {waypoints.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const midWp: Waypoint = {
                        id: `wp-${Date.now()}`,
                        name: "Custom Stop",
                        lat: waypoints[0].lat + (Math.random() - 0.5) * 0.1,
                        lng: waypoints[0].lng + (Math.random() - 0.5) * 0.1,
                      };
                      const updated = [...waypoints];
                      updated.splice(waypoints.length - 1, 0, midWp);
                      onWaypointsChange(updated);
                    }}
                    className="w-full py-1.5 border border-dashed border-[#2F2F34] text-[#A7A7AD] text-xs hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors flex items-center justify-center gap-1"
                    data-ocid="waypoints.secondary_button"
                  >
                    <Plus size={10} /> ADD STOP
                  </button>
                )}
              </div>

              {/* Speed Limits - Driving only */}
              {mode === "driving" && speedLimits.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-[#A7A7AD] tracking-wider">
                    SPEED LIMITS DETECTED
                  </p>
                  <div className="bg-[#0e0e0f] border border-[#2F2F34] divide-y divide-[#2F2F34]">
                    {speedLimits.map((sl) => (
                      <div
                        key={sl.speed}
                        className="flex items-center justify-between px-3 py-1.5"
                      >
                        <span className="text-xs text-[#E7E7EA] font-bold">
                          {sl.speed}
                        </span>
                        <span className="text-[10px] text-[#A7A7AD]">
                          {sl.count} zones
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist */}
              <div className="space-y-1">
                <p className="text-[10px] text-[#A7A7AD] tracking-wider">
                  CHECKLIST
                </p>
                <Checklist mode={mode} />
              </div>

              {/* Overlay Controls */}
              <div className="space-y-1">
                <p className="text-[10px] text-[#A7A7AD] tracking-wider">
                  MAP OVERLAYS
                </p>
                <OverlayControls
                  overlays={overlays}
                  onToggle={onToggleOverlay}
                  staticOverlays={staticOverlays}
                  onToggleStatic={onToggleStatic}
                />
              </div>

              {/* Saved Places */}
              <div className="space-y-1">
                <p className="text-[10px] text-[#A7A7AD] tracking-wider">
                  SAVED PLACES
                </p>
                <SavedPlaces
                  waypoints={waypoints}
                  onLoadDestination={onLoadDestination}
                  onFlyTo={onFlyTo}
                />
              </div>
            </div>
          </ScrollArea>
        </>
      )}
    </aside>
  );
}
