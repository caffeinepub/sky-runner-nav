import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  MapPin,
  Plus,
  Search,
  Settings2,
  Trash2,
  TreePine,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import type { GeoPosition } from "../hooks/useGeolocation";
import type {
  FlyingRestStop,
  OverlayType,
  SavedDestinationLocal,
  SpeedLimit,
  TravelMode,
  Waypoint,
  XutionBuilding,
} from "../types";
import { Checklist } from "./Checklist";
import { OfflineSearch } from "./OfflineSearch";
import { OverlayControls } from "./OverlayControls";
import { SavedPlaces } from "./SavedPlaces";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const XUTION_CATEGORIES = [
  "Office",
  "Shelter",
  "Hub",
  "Supply Depot",
  "HQ",
  "Other",
];

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
  onAddSavedAsWaypoint: (dest: SavedDestinationLocal) => void;
  routeDistance: number | null;
  routeDuration: number | null;
  position: GeoPosition | null;
  pendingMapClick: { lat: number; lng: number } | null;
  onClearPendingMapClick: () => void;
  onSetDestinationFromClick: (lat: number, lng: number) => void;
  onAddWaypointFromClick: (lat: number, lng: number) => void;
  flyingRestStops: FlyingRestStop[];
  restStopFrequency: number | null;
  onChangeRestStops: () => void;
  navigationActive: boolean;
  onGoPress: () => void;
  onStopPress: () => void;
  // Xution Buildings
  xutionBuildings: XutionBuilding[];
  onAddXutionBuilding: (b: Omit<XutionBuilding, "id" | "createdAt">) => void;
  onDeleteXutionBuilding: (id: string) => void;
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
  onAddSavedAsWaypoint,
  routeDistance,
  routeDuration,
  position,
  pendingMapClick,
  onClearPendingMapClick,
  onSetDestinationFromClick,
  onAddWaypointFromClick,
  flyingRestStops,
  restStopFrequency,
  onChangeRestStops,
  navigationActive,
  onGoPress,
  onStopPress,
  xutionBuildings,
  onAddXutionBuilding,
  onDeleteXutionBuilding,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Xution Building form state
  const [xbName, setXbName] = useState("");
  const [xbCategory, setXbCategory] = useState(XUTION_CATEGORIES[0]);
  const [xbNotes, setXbNotes] = useState("");
  const [xbLat, setXbLat] = useState("");
  const [xbLng, setXbLng] = useState("");
  const [xbFormOpen, setXbFormOpen] = useState(false);

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

  const handleAddOfflineWaypoint = (lat: number, lng: number, name: string) => {
    const wp: Waypoint = { id: `wp-${Date.now()}`, name, lat, lng };
    onWaypointsChange([...waypoints, wp]);
    onFlyTo(lat, lng);
  };

  const handleAddXbBuilding = () => {
    const lat = Number.parseFloat(xbLat);
    const lng = Number.parseFloat(xbLng);
    if (!xbName.trim() || Number.isNaN(lat) || Number.isNaN(lng)) return;
    onAddXutionBuilding({
      name: xbName.trim(),
      category: xbCategory,
      lat,
      lng,
      notes: xbNotes.trim(),
    });
    setXbName("");
    setXbNotes("");
    setXbLat("");
    setXbLng("");
    setXbFormOpen(false);
  };

  // Pre-fill coords from map click
  const openXbForm = () => {
    if (pendingMapClick && !xbLat && !xbLng) {
      setXbLat(pendingMapClick.lat.toFixed(5));
      setXbLng(pendingMapClick.lng.toFixed(5));
    }
    setXbFormOpen(true);
  };

  const restStopLabel =
    restStopFrequency === null
      ? null
      : restStopFrequency === -1
        ? "No stops"
        : restStopFrequency < 1
          ? `Every ${Math.round(restStopFrequency * 60)}min`
          : `Every ${restStopFrequency}h`;

  const canNavigate = waypoints.length >= 2;

  const xbFormValid =
    xbName.trim().length > 0 &&
    !Number.isNaN(Number.parseFloat(xbLat)) &&
    !Number.isNaN(Number.parseFloat(xbLng));

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
              XUTION
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

          <ScrollArea className="flex-1 min-h-0">
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

              {/* Pending Map Click */}
              {pendingMapClick && (
                <div className="bg-[#0e0e0f] border border-[#D4AF37]/60 p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin
                        size={10}
                        className="text-[#D4AF37] flex-shrink-0"
                      />
                      <p className="text-[10px] text-[#D4AF37] tracking-wider font-bold">
                        MAP SELECTION
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClearPendingMapClick}
                      className="text-[#A7A7AD] hover:text-[#E7E7EA] transition-colors"
                      title="Clear"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <p className="text-xs text-[#E7E7EA] font-mono">
                    {pendingMapClick.lat.toFixed(5)},{" "}
                    {pendingMapClick.lng.toFixed(5)}
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onSetDestinationFromClick(
                          pendingMapClick.lat,
                          pendingMapClick.lng,
                        )
                      }
                      className="flex-1 py-1.5 bg-[#D4AF37] text-[#020202] text-[10px] font-bold tracking-wider hover:bg-[#c49f2f] transition-colors"
                      data-ocid="mapclick.set_destination_button"
                    >
                      SET DESTINATION
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAddWaypointFromClick(
                          pendingMapClick.lat,
                          pendingMapClick.lng,
                        )
                      }
                      className="flex-1 py-1.5 border border-[#D4AF37]/60 text-[#D4AF37] text-[10px] font-bold tracking-wider hover:bg-[#D4AF37]/10 transition-colors"
                      data-ocid="mapclick.add_waypoint_button"
                    >
                      ADD WAYPOINT
                    </button>
                  </div>
                </div>
              )}

              {/* Search (Online - Nominatim) */}
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

              {/* Offline Search */}
              <div className="space-y-1 border-t border-[#2F2F34] pt-3">
                <OfflineSearch
                  onFlyTo={onFlyTo}
                  onAddAsWaypoint={handleAddOfflineWaypoint}
                  xutionBuildings={xutionBuildings}
                />
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

              {/* GO / STOP button */}
              {mode !== "teleport" && (
                <div>
                  {navigationActive ? (
                    <button
                      type="button"
                      onClick={onStopPress}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold tracking-[0.3em] uppercase transition-colors border border-red-500/60 shadow-[0_0_16px_rgba(220,38,38,0.3)]"
                      data-ocid="navigation.stop_button"
                    >
                      ■ STOP
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onGoPress}
                      disabled={!canNavigate}
                      className="w-full py-3 font-bold tracking-[0.3em] uppercase text-sm transition-all border
                        disabled:opacity-30 disabled:cursor-not-allowed disabled:border-[#2F2F34] disabled:text-[#A7A7AD] disabled:bg-transparent
                        enabled:bg-[#D4AF37] enabled:text-[#020202] enabled:border-[#D4AF37] enabled:hover:bg-[#c49f2f] enabled:hover:border-[#c49f2f] enabled:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                      data-ocid="navigation.primary_button"
                    >
                      ▶ GO
                    </button>
                  )}
                  {!canNavigate && !navigationActive && (
                    <p className="text-[10px] text-[#A7A7AD] text-center mt-1">
                      Add 2+ waypoints to enable
                    </p>
                  )}
                </div>
              )}

              {/* Flying mode: rest stop config */}
              {mode === "flying" && (
                <div className="bg-[#0e0e0f] border border-[#2d7a2d]/60 p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TreePine
                        size={10}
                        className="text-[#2d7a2d] flex-shrink-0"
                      />
                      <p className="text-[10px] text-[#2d7a2d] tracking-wider font-bold">
                        REST STOPS
                      </p>
                    </div>
                    {restStopLabel && (
                      <span className="text-[10px] text-[#A7A7AD]">
                        {restStopLabel}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onChangeRestStops}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-[#2d7a2d]/50 text-[#2d7a2d] text-[10px] hover:bg-[#2d7a2d]/10 hover:border-[#2d7a2d] transition-colors tracking-wider"
                    data-ocid="flying.rest_stops.button"
                  >
                    <Settings2 size={10} />
                    CHANGE REST STOPS
                  </button>
                </div>
              )}

              {/* Forest Rest Stops list */}
              {mode === "flying" && flyingRestStops.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-[#D4AF37] tracking-wider font-bold">
                    FOREST REST STOPS
                  </p>
                  <div className="space-y-1">
                    {flyingRestStops.map((stop, index) => (
                      <div
                        key={stop.id}
                        className="flex items-start gap-2 p-2 bg-[#0e0e0f] border border-[#2d7a2d]/40"
                        data-ocid={`rest_stops.item.${index + 1}`}
                      >
                        <span className="text-sm flex-shrink-0 mt-0.5">🌲</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#E7E7EA] break-words">
                            {stop.name}
                          </p>
                          <p className="text-[10px] text-[#A7A7AD] mt-0.5">
                            Stop {index + 1} ·{" "}
                            {stop.isForest ? "Forest" : "Park/Green Area"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onFlyTo(stop.lat, stop.lng)}
                          className="text-[10px] text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors flex-shrink-0 mt-0.5 px-1"
                          title="View on map"
                          data-ocid={`rest_stops.view_button.${index + 1}`}
                        >
                          ↗
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  onAddAsWaypoint={onAddSavedAsWaypoint}
                  onFlyTo={onFlyTo}
                />
              </div>

              {/* Xution Buildings */}
              <div className="space-y-2 border-t border-[#2F2F34] pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={10} className="text-[#D4AF37]" />
                    <p className="text-[10px] text-[#D4AF37] tracking-wider font-bold">
                      XUTION BUILDINGS
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      xbFormOpen ? setXbFormOpen(false) : openXbForm()
                    }
                    className="flex items-center gap-1 px-2 py-1 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-colors"
                    data-ocid="xution_buildings.open_modal_button"
                  >
                    {xbFormOpen ? <X size={10} /> : <Plus size={10} />}
                    <span>{xbFormOpen ? "CANCEL" : "ADD"}</span>
                  </button>
                </div>

                {/* Add Building Form */}
                {xbFormOpen && (
                  <div
                    className="bg-[#0e0e0f] border border-[#D4AF37]/30 p-2 space-y-2"
                    data-ocid="xution_buildings.panel"
                  >
                    <p className="text-[10px] text-[#D4AF37] tracking-wider font-bold">
                      NEW XUTION BUILDING
                    </p>

                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={xbName}
                        onChange={(e) => setXbName(e.target.value)}
                        placeholder="Building name *"
                        className="w-full bg-[#1A1819] border border-[#2F2F34] text-[#E7E7EA] text-xs px-2 py-1.5 font-mono placeholder-[#A7A7AD] focus:outline-none focus:border-[#D4AF37]/60 transition-colors"
                        data-ocid="xution_buildings.input"
                      />

                      <select
                        value={xbCategory}
                        onChange={(e) => setXbCategory(e.target.value)}
                        className="w-full bg-[#1A1819] border border-[#2F2F34] text-[#E7E7EA] text-xs px-2 py-1.5 font-mono focus:outline-none focus:border-[#D4AF37]/60 transition-colors"
                        data-ocid="xution_buildings.select"
                      >
                        {XUTION_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={xbLat}
                          onChange={(e) => setXbLat(e.target.value)}
                          placeholder="Latitude *"
                          className="flex-1 bg-[#1A1819] border border-[#2F2F34] text-[#E7E7EA] text-xs px-2 py-1.5 font-mono placeholder-[#A7A7AD] focus:outline-none focus:border-[#D4AF37]/60 transition-colors"
                          data-ocid="xution_buildings.input"
                        />
                        <input
                          type="text"
                          value={xbLng}
                          onChange={(e) => setXbLng(e.target.value)}
                          placeholder="Longitude *"
                          className="flex-1 bg-[#1A1819] border border-[#2F2F34] text-[#E7E7EA] text-xs px-2 py-1.5 font-mono placeholder-[#A7A7AD] focus:outline-none focus:border-[#D4AF37]/60 transition-colors"
                          data-ocid="xution_buildings.input"
                        />
                      </div>

                      {pendingMapClick && (
                        <button
                          type="button"
                          onClick={() => {
                            setXbLat(pendingMapClick.lat.toFixed(5));
                            setXbLng(pendingMapClick.lng.toFixed(5));
                          }}
                          className="w-full py-1 border border-dashed border-[#D4AF37]/40 text-[#D4AF37]/70 text-[10px] hover:border-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors"
                        >
                          USE MAP CLICK COORDINATES
                        </button>
                      )}

                      <textarea
                        value={xbNotes}
                        onChange={(e) => setXbNotes(e.target.value)}
                        placeholder="Notes (optional)"
                        rows={2}
                        className="w-full bg-[#1A1819] border border-[#2F2F34] text-[#E7E7EA] text-xs px-2 py-1.5 font-mono placeholder-[#A7A7AD] focus:outline-none focus:border-[#D4AF37]/60 transition-colors resize-none"
                        data-ocid="xution_buildings.textarea"
                      />

                      <button
                        type="button"
                        onClick={handleAddXbBuilding}
                        disabled={!xbFormValid}
                        className="w-full py-2 font-bold text-[10px] tracking-wider uppercase transition-all border disabled:opacity-30 disabled:cursor-not-allowed disabled:border-[#2F2F34] disabled:text-[#A7A7AD] disabled:bg-transparent enabled:bg-[#D4AF37] enabled:text-[#020202] enabled:border-[#D4AF37] enabled:hover:bg-[#c49f2f]"
                        data-ocid="xution_buildings.submit_button"
                      >
                        ADD BUILDING
                      </button>
                    </div>
                  </div>
                )}

                {/* Buildings list */}
                {xutionBuildings.length === 0 && !xbFormOpen && (
                  <p
                    className="text-xs text-[#A7A7AD] py-1"
                    data-ocid="xution_buildings.empty_state"
                  >
                    No Xution buildings added yet.
                  </p>
                )}

                <div className="space-y-1">
                  {xutionBuildings.map((b, index) => (
                    <div
                      key={b.id}
                      className="flex items-start gap-2 p-2 bg-[#0e0e0f] border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-colors"
                      data-ocid={`xution_buildings.item.${index + 1}`}
                    >
                      <Building2
                        size={12}
                        className="text-[#D4AF37]/70 flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#E7E7EA] font-bold truncate">
                          {b.name}
                        </p>
                        <p className="text-[10px] text-[#A7A7AD]">
                          {b.category} ·{" "}
                          <span className="font-mono">
                            {b.lat.toFixed(3)},{b.lng.toFixed(3)}
                          </span>
                        </p>
                        {b.notes && (
                          <p className="text-[10px] text-[#A7A7AD] truncate mt-0.5">
                            {b.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onFlyTo(b.lat, b.lng)}
                          className="text-[10px] text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors px-1"
                          title="Fly to"
                          data-ocid={`xution_buildings.edit_button.${index + 1}`}
                        >
                          ↗
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteXutionBuilding(b.id)}
                          className="text-[10px] text-[#A7A7AD] hover:text-red-400 transition-colors px-1"
                          title="Delete"
                          data-ocid={`xution_buildings.delete_button.${index + 1}`}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </>
      )}
    </aside>
  );
}
