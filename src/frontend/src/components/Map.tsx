import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { GeoPosition } from "../hooks/useGeolocation";
import type { OverlayType, OverpassNode, Waypoint } from "../types";

const FOREST_LABELS = [
  { name: "Amazon Rainforest", lng: -60.0, lat: -3.0 },
  { name: "Daintree Rainforest", lng: 145.4, lat: -16.2 },
  { name: "Congo Rainforest", lng: 24.0, lat: 1.0 },
  { name: "Tongass National Forest", lng: -134.0, lat: 57.5 },
  { name: "Black Forest", lng: 8.2, lat: 48.0 },
  { name: "Sherwood Forest", lng: -1.07, lat: 53.2 },
  { name: "Dordogne Forest", lng: 1.0, lat: 44.8 },
  { name: "Siberian Taiga", lng: 90.0, lat: 60.0 },
  { name: "Borneo Rainforest", lng: 114.0, lat: 1.0 },
  { name: "Great Bear Rainforest", lng: -127.0, lat: 52.5 },
  { name: "Valdivian Temperate Forest", lng: -72.0, lat: -40.0 },
  { name: "Białowieża Forest", lng: 23.8, lat: 52.7 },
];

const OCEAN_LABELS = [
  { name: "Pacific Ocean", lng: -150.0, lat: 0.0 },
  { name: "Atlantic Ocean", lng: -30.0, lat: 0.0 },
  { name: "Indian Ocean", lng: 80.0, lat: -20.0 },
  { name: "Arctic Ocean", lng: 0.0, lat: 85.0 },
  { name: "Southern Ocean", lng: 0.0, lat: -65.0 },
  { name: "Mediterranean Sea", lng: 15.0, lat: 37.0 },
  { name: "Caribbean Sea", lng: -74.0, lat: 15.0 },
  { name: "South China Sea", lng: 114.0, lat: 15.0 },
  { name: "Gulf of Mexico", lng: -90.0, lat: 25.0 },
  { name: "North Sea", lng: 3.0, lat: 56.0 },
  { name: "Red Sea", lng: 38.0, lat: 22.0 },
  { name: "Black Sea", lng: 33.0, lat: 43.0 },
  { name: "Arabian Sea", lng: 65.0, lat: 17.0 },
  { name: "Bay of Bengal", lng: 88.0, lat: 15.0 },
  { name: "Coral Sea", lng: 155.0, lat: -18.0 },
];

const WARNING_LOCATIONS = [
  { name: "Pentagon (DC)", lat: 38.8719, lng: -77.0563 },
  { name: "JFK Airport", lat: 40.6413, lng: -73.7781 },
  { name: "LAX Airport", lat: 33.9425, lng: -118.4081 },
  { name: "Area 51", lat: 37.235, lng: -115.811 },
  { name: "Fort Bragg", lat: 35.1396, lng: -79.0063 },
  { name: "Naval Station Norfolk", lat: 36.9365, lng: -76.3212 },
  { name: "Heathrow Airport", lat: 51.47, lng: -0.4543 },
  { name: "O'Hare Airport", lat: 41.9742, lng: -87.9073 },
  { name: "Andrews AFB", lat: 38.8108, lng: -76.8667 },
];

const PLANE_ROUTES = [
  {
    from: [-73.7781, 40.6413] as [number, number],
    to: [-0.4543, 51.47] as [number, number],
    name: "JFK-LHR",
  },
  {
    from: [-118.4081, 33.9425] as [number, number],
    to: [139.7803, 35.5494] as [number, number],
    name: "LAX-NRT",
  },
  {
    from: [-87.9073, 41.9742] as [number, number],
    to: [2.5479, 49.0097] as [number, number],
    name: "ORD-CDG",
  },
  {
    from: [-73.7781, 40.6413] as [number, number],
    to: [2.5479, 49.0097] as [number, number],
    name: "JFK-CDG",
  },
  {
    from: [-118.4081, 33.9425] as [number, number],
    to: [103.9915, 1.3644] as [number, number],
    name: "LAX-SIN",
  },
  {
    from: [-43.1729, -22.8099] as [number, number],
    to: [-3.7038, 40.4936] as [number, number],
    name: "GRU-MAD",
  },
  {
    from: [13.2877, 52.3667] as [number, number],
    to: [116.5977, 40.0801] as [number, number],
    name: "BER-PEK",
  },
  {
    from: [151.1772, -33.9399] as [number, number],
    to: [139.7803, 35.5494] as [number, number],
    name: "SYD-NRT",
  },
  {
    from: [-73.7781, 40.6413] as [number, number],
    to: [37.4146, 55.9736] as [number, number],
    name: "JFK-SVO",
  },
  {
    from: [103.9915, 1.3644] as [number, number],
    to: [55.3644, 25.2532] as [number, number],
    name: "SIN-DXB",
  },
  {
    from: [13.2877, 52.3667] as [number, number],
    to: [-73.7781, 40.6413] as [number, number],
    name: "BER-JFK",
  },
  {
    from: [8.5492, 47.4647] as [number, number],
    to: [-73.7781, 40.6413] as [number, number],
    name: "ZRH-JFK",
  },
];

function createCircle(
  center: [number, number],
  radiusKm: number,
  points = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dlat = (radiusKm / 111.32) * Math.cos(angle);
    const dlng =
      (radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180))) *
      Math.sin(angle);
    coords.push([center[0] + dlng, center[1] + dlat]);
  }
  coords.push(coords[0]);
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

const DYNAMIC_OVERLAY_IDS = [
  "bus-stops",
  "car-rentals",
  "atms",
  "hotels",
  "gas-stations",
  "churches",
  "homeless-shelters",
  "vending-machines",
  "open-24h",
  "id-offices",
];

interface MapViewProps {
  position: GeoPosition | null;
  waypoints: Waypoint[];
  overlays: OverlayType[];
  overlayData: Record<string, OverpassNode[]>;
  staticOverlays: { id: string; label: string; active: boolean }[];
  onMapReady: (map: MapLibreMap) => void;
  mode: string;
}

export function MapView({
  position,
  waypoints,
  overlays,
  overlayData,
  staticOverlays,
  onMapReady,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const waypointMarkersRef = useRef<Marker[]>([]);
  const onMapReadyRef = useRef(onMapReady);
  // removed unused ref
  const mapLoadedRef = useRef(false);
  // Store latest overlays/overlayData/staticOverlays for use in load callback
  const overlaysRef = useRef(overlays);
  const overlayDataRef = useRef(overlayData);
  const staticOverlaysRef = useRef(staticOverlays);
  onMapReadyRef.current = onMapReady;
  overlaysRef.current = overlays;
  overlayDataRef.current = overlayData;
  staticOverlaysRef.current = staticOverlays;

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    mapRef.current = map;

    map.on("load", () => {
      mapLoadedRef.current = true;

      // Route source + layers
      map.addSource("route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#D4AF37",
          "line-width": 12,
          "line-opacity": 0.2,
          "line-blur": 6,
        },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#D4AF37",
          "line-width": 3.5,
          "line-opacity": 0.95,
        },
      });

      // Warning rings
      map.addSource("warning-rings", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: WARNING_LOCATIONS.map((loc) =>
            createCircle([loc.lng, loc.lat], 96.56),
          ),
        },
      });
      map.addLayer({
        id: "warning-rings-fill",
        type: "fill",
        source: "warning-rings",
        paint: { "fill-color": "#ff4444", "fill-opacity": 0.06 },
        layout: { visibility: "none" },
      });
      map.addLayer({
        id: "warning-rings-outline",
        type: "line",
        source: "warning-rings",
        paint: {
          "line-color": "#ff4444",
          "line-width": 1.5,
          "line-opacity": 0.5,
        },
        layout: { visibility: "none" },
      });

      // Plane routes
      map.addSource("plane-routes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: PLANE_ROUTES.map((r) => ({
            type: "Feature" as const,
            properties: { name: r.name },
            geometry: {
              type: "LineString" as const,
              coordinates: [r.from, r.to],
            },
          })),
        },
      });
      map.addLayer({
        id: "plane-routes-line",
        type: "line",
        source: "plane-routes",
        paint: {
          "line-color": "#4477cc",
          "line-width": 1.5,
          "line-opacity": 0.5,
          "line-dasharray": [4, 3],
        },
        layout: { visibility: "none" },
      });

      // Country borders
      map.addSource("country-borders", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "country-borders-line",
        type: "line",
        source: "country-borders",
        paint: {
          "line-color": "#888888",
          "line-width": 1,
          "line-opacity": 0.4,
        },
        layout: { visibility: "none" },
      });

      // Forest labels
      map.addSource("forest-labels", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: FOREST_LABELS.map((f) => ({
            type: "Feature" as const,
            properties: { name: f.name },
            geometry: {
              type: "Point" as const,
              coordinates: [f.lng, f.lat],
            },
          })),
        },
      });
      map.addLayer({
        id: "forest-labels-text",
        type: "symbol",
        source: "forest-labels",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#b8d4b0",
          "text-halo-color": "rgba(0,0,0,0.5)",
          "text-halo-width": 1,
          "text-opacity": 0.8,
        },
      });

      // Ocean labels
      map.addSource("ocean-labels", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: OCEAN_LABELS.map((o) => ({
            type: "Feature" as const,
            properties: { name: o.name },
            geometry: {
              type: "Point" as const,
              coordinates: [o.lng, o.lat],
            },
          })),
        },
      });
      map.addLayer({
        id: "ocean-labels-text",
        type: "symbol",
        source: "ocean-labels",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#a0c4d8",
          "text-halo-color": "rgba(0,0,0,0.5)",
          "text-halo-width": 1,
          "text-opacity": 0.8,
        },
      });

      // Dynamic overlay sources
      for (const overlayId of DYNAMIC_OVERLAY_IDS) {
        map.addSource(overlayId, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: `${overlayId}-circles`,
          type: "circle",
          source: overlayId,
          paint: {
            "circle-radius": 5,
            "circle-color": "#D4AF37",
            "circle-opacity": 0.8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#020202",
          },
          layout: { visibility: "none" },
        });
      }

      // Apply any overlays that were already active before map loaded
      applyOverlays(map, overlaysRef.current, overlayDataRef.current);
      applyStaticOverlays(map, staticOverlaysRef.current);

      onMapReadyRef.current(map);
    });
  }, []);

  // Update user position marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.style.cssText = [
        "width: 14px",
        "height: 14px",
        "background: #D4AF37",
        "border: 2px solid #020202",
        "border-radius: 50%",
        "box-shadow: 0 0 0 4px rgba(212,175,55,0.3), 0 0 12px rgba(212,175,55,0.5)",
      ].join("; ");
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([position.lng, position.lat])
        .addTo(map);
      map.flyTo({ center: [position.lng, position.lat], zoom: 12 });
    } else {
      userMarkerRef.current.setLngLat([position.lng, position.lat]);
    }
  }, [position]);

  // Update waypoint markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    for (const m of waypointMarkersRef.current) m.remove();
    waypointMarkersRef.current = [];

    for (const [index, wp] of waypoints.entries()) {
      const el = document.createElement("div");
      el.style.cssText = [
        "width: 24px",
        "height: 24px",
        "background: #1A1819",
        "border: 2px solid #D4AF37",
        "border-radius: 2px",
        "display: flex",
        "align-items: center",
        "justify-content: center",
        "font-size: 10px",
        "font-weight: bold",
        "color: #D4AF37",
        "font-family: monospace",
        "cursor: pointer",
        "box-shadow: 0 0 8px rgba(212,175,55,0.4)",
      ].join("; ");
      el.textContent = String(index + 1);

      const popup = new maplibregl.Popup({
        closeButton: false,
        offset: 12,
      }).setHTML(
        `<div style="background:#1A1819;color:#E7E7EA;padding:4px 8px;font-family:monospace;font-size:11px;border:1px solid #2F2F34">${wp.name}</div>`,
      );

      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([wp.lng, wp.lat])
        .setPopup(popup)
        .addTo(map);

      waypointMarkersRef.current.push(marker);
    }
  }, [waypoints]);

  // Update static overlay visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    applyStaticOverlays(map, staticOverlays);
  }, [staticOverlays]);

  // Update dynamic overlay layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    applyOverlays(map, overlays, overlayData);
  }, [overlays, overlayData]);

  return (
    <>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 4px rgba(212,175,55,0.3), 0 0 12px rgba(212,175,55,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(212,175,55,0.15), 0 0 20px rgba(212,175,55,0.7); }
        }
      `}</style>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </>
  );
}

function applyStaticOverlays(
  map: MapLibreMap,
  staticOverlays: { id: string; label: string; active: boolean }[],
) {
  const layerMap: Record<string, string[]> = {
    "warning-rings": ["warning-rings-fill", "warning-rings-outline"],
    "plane-routes": ["plane-routes-line"],
    "country-borders": ["country-borders-line"],
  };

  for (const overlay of staticOverlays) {
    const layers = layerMap[overlay.id];
    if (!layers) continue;
    for (const layer of layers) {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(
          layer,
          "visibility",
          overlay.active ? "visible" : "none",
        );
      }
    }

    if (overlay.id === "country-borders" && overlay.active) {
      const src = map.getSource("country-borders") as maplibregl.GeoJSONSource;
      // Only fetch if source is empty (no features loaded yet)
      if (src) {
        fetch(
          "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson",
        )
          .then((r) => r.json())
          .then((data) => {
            const s = map.getSource(
              "country-borders",
            ) as maplibregl.GeoJSONSource;
            if (s) s.setData(data);
          })
          .catch(() => {});
      }
    }
  }
}

function applyOverlays(
  map: MapLibreMap,
  overlays: OverlayType[],
  overlayData: Record<string, OverpassNode[]>,
) {
  for (const overlay of overlays) {
    const layerId = `${overlay.id}-circles`;
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(
        layerId,
        "visibility",
        overlay.active ? "visible" : "none",
      );
    }
    if (overlay.active && overlayData[overlay.id]) {
      const nodes = overlayData[overlay.id];
      const source = map.getSource(overlay.id) as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: nodes.map((n) => ({
            type: "Feature" as const,
            properties: { name: n.tags?.name ?? overlay.label },
            geometry: {
              type: "Point" as const,
              coordinates: [n.lon as number, n.lat as number],
            },
          })),
        });
      }
    }
  }
}
