export type TravelMode = "driving" | "flying" | "teleport";

export interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface RouteInfo {
  distance: number;
  duration: number;
  geometry: GeoJSON.LineString;
}

export interface SpeedLimit {
  speed: string;
  count: number;
}

export interface OverlayType {
  id: string;
  label: string;
  query: string;
  color: string;
  active: boolean;
}

export interface OverpassNode {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface SavedDestinationLocal {
  id: string;
  name: string;
  lat: number;
  lng: number;
  notes: string;
  waypoints?: Waypoint[];
  createdAt: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface FlyingRestStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isForest: boolean;
}
