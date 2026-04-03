import { Toaster } from "@/components/ui/sonner";
import { Locate, LocateFixed, WifiOff } from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type maplibregl from "maplibre-gl";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { MapView } from "./components/Map";
import { ModeSelector } from "./components/ModeSelector";
import { RestStopModal } from "./components/RestStopModal";
import { Sidebar } from "./components/Sidebar";
import { useGeolocation } from "./hooks/useGeolocation";
import { useOverpass } from "./hooks/useOverpass";
import { useRoute } from "./hooks/useRoute";
import type {
  FlyingRestStop,
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

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

async function fetchNearestForest(
  lat: number,
  lng: number,
): Promise<{
  name: string;
  lat: number;
  lng: number;
  isForest: boolean;
} | null> {
  const query = `
[out:json][timeout:25];
(
  node["natural"="forest"](around:80000,${lat},${lng});
  way["natural"="forest"](around:80000,${lat},${lng});
  way["landuse"="forest"](around:80000,${lat},${lng});
  way["leisure"="park"](around:80000,${lat},${lng});
);
out center 5;
`.trim();

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const elements: OverpassNode[] = data.elements ?? [];

    const named = elements.find((e) => e.tags?.name);
    const el = named ?? elements[0];
    if (!el) return null;

    const elLat = el.lat ?? el.center?.lat ?? lat;
    const elLng = el.lon ?? el.center?.lon ?? lng;
    const name =
      el.tags?.name ?? `Forest (${elLat.toFixed(3)}, ${elLng.toFixed(3)})`;
    const isForest =
      el.tags?.natural === "forest" || el.tags?.landuse === "forest";
    return { name, lat: elLat, lng: elLng, isForest };
  } catch {
    return null;
  }
}

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
  const [pendingMapClick, setPendingMapClick] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Navigation active state
  const [navigationActive, setNavigationActive] = useState(false);
  const [navigationStartTime, setNavigationStartTime] = useState<number | null>(
    null,
  );
  const navigationTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Flying rest stop state
  const [restStopFrequency, setRestStopFrequency] = useState<number | null>(
    null,
  );
  const [showRestStopModal, setShowRestStopModal] = useState(false);
  const [_pendingFlyingMode, setPendingFlyingMode] = useState(false);
  const [flyingRestStops, setFlyingRestStops] = useState<FlyingRestStop[]>([]);

  // Location tracking state
  const [trackingUser, setTrackingUser] = useState(false);

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

  // Real-time rest stop timer
  useEffect(() => {
    if (
      !navigationActive ||
      !restStopFrequency ||
      restStopFrequency <= 0 ||
      !navigationStartTime
    )
      return;

    let stopIndex = 0;
    const freqMs = restStopFrequency * 60 * 60 * 1000;

    const timer = setInterval(() => {
      const elapsed = Date.now() - navigationStartTime;
      const expectedStop = (stopIndex + 1) * freqMs;
      if (elapsed >= expectedStop) {
        stopIndex++;
        toast("🌲 Rest Stop Time!", {
          description: "Time for a rest stop! Finding a nearby forest area...",
          duration: 10000,
        });
        const stop = flyingRestStops[stopIndex - 1];
        if (stop) {
          mapInstanceRef.current?.flyTo({
            center: [stop.lng, stop.lat],
            zoom: 12,
          });
        }
      }
    }, 30000);

    navigationTimerRef.current = timer;
    return () => clearInterval(timer);
  }, [
    navigationActive,
    restStopFrequency,
    navigationStartTime,
    flyingRestStops,
  ]);

  // Compute flying rest stops after route calculation
  const computeFlyingRestStops = useCallback(
    async (wps: Waypoint[], freqHours: number) => {
      if (wps.length < 2 || freqHours <= 0) {
        setFlyingRestStops([]);
        return;
      }

      let totalDistance = 0;
      const segments: { dist: number; a: Waypoint; b: Waypoint }[] = [];
      for (let i = 0; i < wps.length - 1; i++) {
        const a = wps[i];
        const b = wps[i + 1];
        const R = 6371000;
        const φ1 = (a.lat * Math.PI) / 180;
        const φ2 = (b.lat * Math.PI) / 180;
        const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
        const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
        const x =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
        const segDist = R * c;
        totalDistance += segDist;
        segments.push({ dist: segDist, a, b });
      }

      const totalTimeHours = totalDistance / (250 * 3600);
      if (totalTimeHours < freqHours) {
        setFlyingRestStops([]);
        return;
      }

      const numStops = Math.floor(totalTimeHours / freqHours);
      const stopPositions: { lat: number; lng: number }[] = [];

      for (let s = 1; s <= numStops; s++) {
        const fraction = (s * freqHours) / totalTimeHours;
        if (fraction >= 1) break;

        const targetDist = fraction * totalDistance;
        let accumulated = 0;
        for (const seg of segments) {
          if (accumulated + seg.dist >= targetDist) {
            const segFraction = (targetDist - accumulated) / seg.dist;
            const lat = seg.a.lat + (seg.b.lat - seg.a.lat) * segFraction;
            const lng = seg.a.lng + (seg.b.lng - seg.a.lng) * segFraction;
            stopPositions.push({ lat, lng });
            break;
          }
          accumulated += seg.dist;
        }
      }

      const results = await Promise.all(
        stopPositions.map((pos, i) =>
          fetchNearestForest(pos.lat, pos.lng).then((found) => {
            if (found) {
              return {
                id: `rest-stop-${i}`,
                name: found.name,
                lat: found.lat,
                lng: found.lng,
                isForest: found.isForest,
              } as FlyingRestStop;
            }
            return {
              id: `rest-stop-${i}`,
              name: `Rest Area (${pos.lat.toFixed(3)}, ${pos.lng.toFixed(3)})`,
              lat: pos.lat,
              lng: pos.lng,
              isForest: false,
            } as FlyingRestStop;
          }),
        ),
      );

      setFlyingRestStops(results);
      if (results.length > 0) {
        toast.success(
          `${results.length} forest rest stop${results.length > 1 ? "s" : ""} mapped`,
        );
      }
    },
    [],
  );

  // Calculate route when waypoints change
  useEffect(() => {
    if (mode === "teleport" || waypoints.length < 1) {
      setFlyingRestStops([]);
      return;
    }
    // Always start from current GPS position if available
    const routeWaypoints = position
      ? [
          {
            id: "current-location",
            name: "Current Location",
            lat: position.lat,
            lng: position.lng,
          },
          ...waypoints.filter((w) => w.id !== "current-location"),
        ]
      : waypoints;
    if (routeWaypoints.length < 2) return;
    calculateRoute(routeWaypoints, mode).then(async (routeInfo) => {
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

      if (
        mode === "flying" &&
        restStopFrequency !== null &&
        restStopFrequency > 0
      ) {
        computeFlyingRestStops(routeWaypoints, restStopFrequency);
      } else if (mode !== "flying") {
        setFlyingRestStops([]);
      }
    });
  }, [
    waypoints,
    position,
    mode,
    calculateRoute,
    fetchSpeedLimits,
    restStopFrequency,
    computeFlyingRestStops,
  ]);

  // Live rerouting: when navigation is active and GPS position updates,
  // prepend current location as the starting point and recalculate route
  const lastReroutePosition = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!navigationActive || !position || waypoints.length < 1) return;
    const last = lastReroutePosition.current;
    // Only reroute if position changed by more than ~30 meters
    if (last) {
      const dlat = Math.abs(position.lat - last.lat);
      const dlng = Math.abs(position.lng - last.lng);
      if (dlat < 0.0003 && dlng < 0.0003) return;
    }
    lastReroutePosition.current = { lat: position.lat, lng: position.lng };

    // Build route starting from current GPS position
    const currentWp = {
      id: "current-location",
      name: "Current Location",
      lat: position.lat,
      lng: position.lng,
    };
    // Merge: current location + remaining destination waypoints (skip any existing current-location entry)
    const destWaypoints = waypoints.filter((w) => w.id !== "current-location");
    const rerouteWaypoints = [currentWp, ...destWaypoints];

    calculateRoute(rerouteWaypoints, mode).then((routeInfo) => {
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
    });
  }, [navigationActive, position, waypoints, mode, calculateRoute]);

  // Auto-follow user location when tracking is enabled
  useEffect(() => {
    if (!trackingUser || !position) return;
    mapInstanceRef.current?.flyTo({
      center: [position.lng, position.lat],
      zoom: 15,
    });
  }, [trackingUser, position]);

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
    } else {
      setFlyingRestStops([]);
      // Stop navigation when mode changes
      setNavigationActive(false);
      setNavigationStartTime(null);
      if (navigationTimerRef.current) {
        clearInterval(navigationTimerRef.current);
        navigationTimerRef.current = null;
      }
    }
  }, [mode]);

  const handleGoPress = useCallback(() => {
    if (waypoints.length < 2) return;
    const now = Date.now();
    setNavigationActive(true);
    setNavigationStartTime(now);
    toast.success("Navigation started!", {
      description: `Heading to ${waypoints[waypoints.length - 1].name}`,
    });
  }, [waypoints]);

  const handleStopPress = useCallback(() => {
    setNavigationActive(false);
    setNavigationStartTime(null);
    if (navigationTimerRef.current) {
      clearInterval(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    toast("Navigation stopped");
  }, []);

  const handleModeChange = useCallback(
    (newMode: TravelMode) => {
      if (newMode === "flying" && restStopFrequency === null) {
        setPendingFlyingMode(true);
        setShowRestStopModal(true);
      } else {
        setMode(newMode);
      }
    },
    [restStopFrequency],
  );

  const handleRestStopSelect = useCallback((hours: number) => {
    setRestStopFrequency(hours);
    setShowRestStopModal(false);
    setPendingFlyingMode(false);
    setMode("flying");
  }, []);

  const handleRestStopSkip = useCallback(() => {
    setRestStopFrequency(-1);
    setShowRestStopModal(false);
    setPendingFlyingMode(false);
    setMode("flying");
  }, []);

  const handleRestStopModalClose = useCallback(() => {
    setShowRestStopModal(false);
    setPendingFlyingMode(false);
  }, []);

  const handleChangeRestStops = useCallback(() => {
    setRestStopFrequency(null);
    setFlyingRestStops([]);
    setShowRestStopModal(true);
    setPendingFlyingMode(true);
  }, []);

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

  const handleAddSavedAsWaypoint = useCallback(
    (dest: SavedDestinationLocal) => {
      const wp: Waypoint = {
        id: `wp-${Date.now()}`,
        name: dest.name,
        lat: dest.lat,
        lng: dest.lng,
      };
      setWaypoints((prev) => [...prev, wp]);
      toast.success(`Added waypoint: ${dest.name}`);
    },
    [],
  );

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

  const handleMapClick = useCallback(
    (lat: number, lng: number, action: "destination" | "waypoint") => {
      const name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const wp: Waypoint = { id: `wp-${Date.now()}`, name, lat, lng };
      setPendingMapClick({ lat, lng });
      if (action === "destination") {
        setWaypoints((prev) => {
          if (prev.length === 0) return [wp];
          return [...prev.slice(0, -1), wp];
        });
        toast.success("Destination set");
      } else {
        setWaypoints((prev) => [...prev, wp]);
        toast.success("Waypoint added");
      }
    },
    [],
  );

  const handleSidebarSetDestination = useCallback(
    (lat: number, lng: number) => {
      const name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const wp: Waypoint = { id: `wp-${Date.now()}`, name, lat, lng };
      setWaypoints((prev) => {
        if (prev.length === 0) return [wp];
        return [...prev.slice(0, -1), wp];
      });
      setPendingMapClick(null);
      toast.success("Destination set");
    },
    [],
  );

  const handleSidebarAddWaypoint = useCallback((lat: number, lng: number) => {
    const name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const wp: Waypoint = { id: `wp-${Date.now()}`, name, lat, lng };
    setWaypoints((prev) => [...prev, wp]);
    setPendingMapClick(null);
    toast.success("Waypoint added");
  }, []);

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
          {/* Wing icon — user-specified gold wing */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 122.88 121.46"
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0"
            aria-hidden="true"
            style={
              { enableBackground: "new 0 0 122.88 121.46" } as CSSProperties
            }
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12.35,121.46c-8.01-9.72-11.92-19.29-12.31-28.71C-0.78,73.01,10.92,58.28,28.3,47.67 c18.28-11.16,37.08-13.93,55.36-22.25C92.79,21.27,103.68,14.47,121.8,0c5.92,15.69-12.92,40.9-43.52,54.23 c9.48,0.37,19.69-2.54,30.85-9.74c-0.76,19.94-16.46,32.21-51.3,36.95c7.33,2.45,16.09,2.58,27.27-0.58 C74.33,116.81,29.9,91.06,12.35,121.46L12.35,121.46z"
              fill="#D4AF37"
            />
          </svg>
          <span className="text-[#D4AF37] font-bold text-sm tracking-[0.2em] uppercase">
            Xution Nav
          </span>
          <span className="text-[#2F2F34] text-xs">|</span>
          <span className="text-[#A7A7AD] text-xs tracking-wider hidden md:block">
            NAV SYSTEM
          </span>
        </div>
        <ModeSelector mode={mode} onChange={handleModeChange} />
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
          onAddSavedAsWaypoint={handleAddSavedAsWaypoint}
          routeDistance={route?.distance ?? null}
          routeDuration={route?.duration ?? null}
          position={position}
          pendingMapClick={pendingMapClick}
          onClearPendingMapClick={() => setPendingMapClick(null)}
          onSetDestinationFromClick={handleSidebarSetDestination}
          onAddWaypointFromClick={handleSidebarAddWaypoint}
          flyingRestStops={flyingRestStops}
          restStopFrequency={restStopFrequency}
          onChangeRestStops={handleChangeRestStops}
          navigationActive={navigationActive}
          onGoPress={handleGoPress}
          onStopPress={handleStopPress}
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
            onMapClick={handleMapClick}
            mode={mode}
            flyingRestStops={flyingRestStops}
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

          {/* Navigation active badge */}
          {navigationActive && (
            <div className="absolute top-12 right-12 bg-[#1A1819]/90 border border-[#D4AF37]/60 px-3 py-1.5 text-[10px] text-[#D4AF37] tracking-widest font-bold pointer-events-none animate-pulse">
              ▶ NAVIGATING
            </div>
          )}

          {/* GPS coordinate display when tracking */}
          {trackingUser && position && (
            <div
              data-ocid="map.gps_coords.panel"
              className="absolute bottom-[5.5rem] right-4 pointer-events-none bg-[#0e0e0f]/90 border border-[#D4AF37]/50 px-3 py-2 text-right space-y-0.5"
            >
              <p className="text-[9px] text-[#D4AF37]/60 tracking-widest font-mono">
                GPS COORDS
              </p>
              <p className="text-[10px] text-[#D4AF37] font-mono font-bold">
                {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
              </p>
              {position.accuracy !== undefined && (
                <p className="text-[9px] text-[#D4AF37]/70 font-mono">
                  ±{Math.round(position.accuracy)}m
                </p>
              )}
            </div>
          )}

          {/* Track Location button */}
          <button
            type="button"
            onClick={() => {
              const next = !trackingUser;
              setTrackingUser(next);
              if (next && position) {
                mapInstanceRef.current?.flyTo({
                  center: [position.lng, position.lat],
                  zoom: 15,
                });
              }
            }}
            className={`absolute bottom-10 right-4 flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-widest border transition-all ${
              trackingUser
                ? "bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_12px_rgba(212,175,55,0.6)]"
                : "bg-[#0e0e0f]/90 border-[#2F2F34] text-[#A7A7AD] hover:border-[#D4AF37] hover:text-[#D4AF37]"
            }`}
            data-ocid="map.track_location.button"
          >
            <LocateFixed
              size={13}
              className={trackingUser ? "animate-pulse" : ""}
            />
            <span>{trackingUser ? "TRACKING" : "TRACK LOCATION"}</span>
          </button>

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

      {/* Rest Stop Modal */}
      <RestStopModal
        open={showRestStopModal}
        onSelect={handleRestStopSelect}
        onSkip={handleRestStopSkip}
        onClose={handleRestStopModalClose}
      />

      <Toaster theme="dark" />
    </div>
  );
}
