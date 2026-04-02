import { Toaster } from "@/components/ui/sonner";
import { Locate, Navigation, WifiOff } from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type maplibregl from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MapView } from "./components/Map";
import { ModeSelector } from "./components/ModeSelector";
import { Sidebar } from "./components/Sidebar";
import { useGeolocation } from "./hooks/useGeolocation";
import { useOverpass } from "./hooks/useOverpass";
import { useRoute } from "./hooks/useRoute";
import type {
  OverlayType,
  OverpassNode,
  SavedDestinationLocal,
  SpeedLimit,
  TravelMode,
  Waypoint,
} from "./types";

const INITIAL_OVERLAYS: OverlayType[] = [
  {
    id: "bus-stops",
    label: "Bus Stops",
    query: "node[highway=bus_stop]({{bbox}})",
    color: "#D4AF37",
    active: false,
  },
  {
    id: "car-rentals",
    label: "Car Rentals",
    query: "node[amenity=car_rental]({{bbox}})",
    color: "#D4AF37",
    active: false,
  },
  {
    id: "atms",
    label: "ATMs",
    query: "node[amenity=atm]({{bbox}})",
    color: "#D4AF37",
    active: false,
  },
  {
    id: "hotels",
    label: "Hotels",
    query: "node[tourism=hotel]({{bbox}})",
    color: "#D4AF37",
    active: false,
  },
  {
    id: "gas-stations",
    label: "Gas Stations",
    query: "node[amenity=fuel]({{bbox}})",
    color: "#D4AF37",
    active: false,
  },
  {
    id: "churches",
    label: "Churches",
    query: "node[amenity=place_of_worship]({{bbox}})",
    color: "#D4AF37",
    active: false,
  },
  {
    id: "homeless-shelters",
    label: "Shelters",
    query: "node[social_facility=shelter]({{bbox}})",
    color: "#D4AF37",
    active: false,
  },
  {
    id: "vending-machines",
    label: "Vending",
    query: "node[amenity=vending_machine][vending=drinks]({{bbox}})",
    color: "#D4AF37",
    active: false,
  },
  {
    id: "open-24h",
    label: "24h Open",
    query: `(node[opening_hours~"24/7"]({{bbox}});way[opening_hours~"24/7"]({{bbox}});relation[opening_hours~"24/7"]({{bbox}});)`,
    color: "#D4AF37",
    active: false,
  },
  {
    id: "id-offices",
    label: "ID Offices",
    query: "node[office=government]({{bbox}})",
    color: "#D4AF37",
    active: false,
  },
];

const INITIAL_STATIC_OVERLAYS = [
  { id: "warning-rings", label: "⚠ Warning Rings", active: false },
  { id: "plane-routes", label: "✈ Plane Routes", active: false },
  { id: "country-borders", label: "🗺 Borders", active: false },
];

export default function App() {
  const [mode, setMode] = useState<TravelMode>("driving");
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [overlays, setOverlays] = useState<OverlayType[]>(INITIAL_OVERLAYS);
  const [staticOverlays, setStaticOverlays] = useState(INITIAL_STATIC_OVERLAYS);
  const [overlayData, setOverlayData] = useState<
    Record<string, OverpassNode[]>
  >({});
  const [speedLimits, setSpeedLimits] = useState<SpeedLimit[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);

  const { position } = useGeolocation();
  const { fetchNodes, fetchSpeedLimits } = useOverpass();
  const { route, calculateRoute } = useRoute();

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Calculate route when waypoints change
  useEffect(() => {
    if (mode === "teleport" || waypoints.length < 2) return;
    calculateRoute(waypoints).then(async (routeInfo) => {
      if (!routeInfo) return;

      const map = mapInstanceRef.current;
      if (map?.isStyleLoaded()) {
        const src = map.getSource("route") as maplibregl.GeoJSONSource;
        if (src) {
          src.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: routeInfo.geometry,
              },
            ],
          });
        }
      }

      if (mode === "driving" && routeInfo.geometry.coordinates.length > 0) {
        const coords = routeInfo.geometry.coordinates;
        const lngs = coords.map((c) => c[0]);
        const lats = coords.map((c) => c[1]);
        const bbox: [number, number, number, number] = [
          Math.min(...lats),
          Math.min(...lngs),
          Math.max(...lats),
          Math.max(...lngs),
        ];
        const limits = await fetchSpeedLimits(bbox);
        setSpeedLimits(limits);
      }
    });
  }, [waypoints, mode, calculateRoute, fetchSpeedLimits]);

  // Mode change side-effects
  useEffect(() => {
    if (mode === "teleport") {
      const map = mapInstanceRef.current;
      if (map?.isStyleLoaded()) {
        const src = map.getSource("route") as maplibregl.GeoJSONSource;
        if (src) src.setData({ type: "FeatureCollection", features: [] });
      }
    }
    if (mode === "flying") {
      setStaticOverlays((prev) =>
        prev.map((o) => (o.id === "plane-routes" ? { ...o, active: true } : o)),
      );
    }
  }, [mode]);

  const handleToggleOverlay = useCallback(
    async (id: string) => {
      const overlay = overlays.find((o) => o.id === id);
      if (!overlay) return;

      setOverlays((prev) =>
        prev.map((o) => (o.id === id ? { ...o, active: !o.active } : o)),
      );

      if (!overlay.active && mapInstanceRef.current) {
        const map = mapInstanceRef.current;
        const bounds = map.getBounds();
        const bbox: [number, number, number, number] = [
          bounds.getSouth(),
          bounds.getWest(),
          bounds.getNorth(),
          bounds.getEast(),
        ];
        try {
          const nodes = await fetchNodes(overlay.query, bbox);
          setOverlayData((prev) => ({ ...prev, [id]: nodes }));
          toast.success(`${overlay.label}: ${nodes.length} found`);
        } catch {
          toast.error(`Failed to fetch ${overlay.label}`);
        }
      }
    },
    [overlays, fetchNodes],
  );

  const handleToggleStatic = useCallback((id: string) => {
    setStaticOverlays((prev) =>
      prev.map((o) => (o.id === id ? { ...o, active: !o.active } : o)),
    );
  }, []);

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    mapInstanceRef.current?.flyTo({ center: [lng, lat], zoom: 12 });
  }, []);

  const handleLoadDestination = useCallback((dest: SavedDestinationLocal) => {
    if (dest.waypoints && dest.waypoints.length > 0) {
      setWaypoints(dest.waypoints);
      toast.success(`Loaded: ${dest.name}`);
    } else {
      const wp: Waypoint = {
        id: `wp-${Date.now()}`,
        name: dest.name,
        lat: dest.lat,
        lng: dest.lng,
      };
      setWaypoints([wp]);
    }
  }, []);

  const handleLocateMe = useCallback(() => {
    if (position) {
      mapInstanceRef.current?.flyTo({
        center: [position.lng, position.lat],
        zoom: 14,
      });
    } else {
      toast.error("Location not available");
    }
  }, [position]);

  const handleMapReady = useCallback((map: MapLibreMap) => {
    mapInstanceRef.current = map;
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#020202] font-mono overflow-hidden">
      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-[#0e0e0f] border-b border-[#2F2F34]"
        style={{ height: 52 }}
      >
        <div className="flex items-center gap-3">
          <Navigation size={18} className="text-[#D4AF37]" />
          <span className="text-[#D4AF37] font-bold text-sm tracking-[0.2em] uppercase">
            SKY-RUNNER
          </span>
          <span className="text-[#2F2F34] text-xs">|</span>
          <span className="text-[#A7A7AD] text-xs tracking-wider hidden md:block">
            NAV SYSTEM v1.0
          </span>
        </div>
        <ModeSelector mode={mode} onChange={setMode} />
        <div className="flex items-center gap-2">
          {isOffline && (
            <div className="flex items-center gap-1 px-2 py-1 border border-amber-500/50 text-amber-400 text-[10px] tracking-wider">
              <WifiOff size={10} />
              <span>OFFLINE</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleLocateMe}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2F2F34] text-[#A7A7AD] text-xs hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
            data-ocid="header.locate.button"
          >
            <Locate size={12} />
            <span className="hidden sm:inline">LOCATE</span>
          </button>
          {position && (
            <span className="text-[#A7A7AD] text-[10px] hidden md:block">
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </span>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
          mode={mode}
          waypoints={waypoints}
          onWaypointsChange={setWaypoints}
          overlays={overlays}
          onToggleOverlay={handleToggleOverlay}
          staticOverlays={staticOverlays}
          onToggleStatic={handleToggleStatic}
          speedLimits={speedLimits}
          onFlyTo={handleFlyTo}
          onLoadDestination={handleLoadDestination}
          routeDistance={route?.distance ?? null}
          routeDuration={route?.duration ?? null}
          position={position}
        />

        {/* Map */}
        <div
          className="flex-1 relative"
          style={{ height: "calc(100vh - 52px)" }}
        >
          <MapView
            position={position}
            waypoints={waypoints}
            overlays={overlays}
            overlayData={overlayData}
            staticOverlays={staticOverlays}
            onMapReady={handleMapReady}
            mode={mode}
          />

          {/* Offline + GPS badge */}
          {isOffline && position && (
            <div className="absolute top-3 left-3 bg-[#0e0e0f]/95 border border-amber-500/50 px-3 py-2 pointer-events-none space-y-0.5">
              <p className="text-[10px] text-amber-400 font-bold tracking-widest">
                OFFLINE — GPS ACTIVE
              </p>
              <p className="text-[10px] text-amber-300 font-mono">
                {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
              </p>
              {position.accuracy !== undefined && (
                <p className="text-[10px] text-amber-300/70">
                  ±{Math.round(position.accuracy)}m accuracy
                </p>
              )}
            </div>
          )}

          {/* Mode badge */}
          <div className="absolute top-3 right-12 bg-[#1A1819]/90 border border-[#2F2F34] px-3 py-1.5 text-[10px] text-[#D4AF37] tracking-widest font-bold pointer-events-none">
            {mode.toUpperCase()} MODE
          </div>

          {/* Route hint */}
          {waypoints.length < 2 && mode !== "teleport" && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#1A1819]/90 border border-[#2F2F34] px-4 py-2 text-xs text-[#A7A7AD] pointer-events-none whitespace-nowrap">
              Add 2+ waypoints to calculate route
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 flex items-center justify-center py-1 bg-[#0e0e0f] border-t border-[#2F2F34]">
        <p className="text-[10px] text-[#A7A7AD]">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D4AF37] hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster theme="dark" />
    </div>
  );
}
