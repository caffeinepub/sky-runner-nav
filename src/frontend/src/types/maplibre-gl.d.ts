// Type stub for maplibre-gl (loaded via CDN in production)
// biome-ignore lint/suspicious/noShadowRestrictedNames: needed for maplibre-gl type declarations
declare module "maplibre-gl" {
  export interface LngLatLike {
    lng: number;
    lat: number;
  }

  export interface MapOptions {
    container: string | HTMLElement;
    style: string | object;
    center?: [number, number];
    zoom?: number;
    attributionControl?: boolean;
    [key: string]: unknown;
  }

  export interface MarkerOptions {
    element?: HTMLElement;
    color?: string;
    draggable?: boolean;
    [key: string]: unknown;
  }

  export interface PopupOptions {
    closeOnClick?: boolean;
    maxWidth?: string;
    offset?: number | [number, number];
    [key: string]: unknown;
  }

  export interface LayerSpecification {
    id: string;
    type: string;
    source?: string;
    paint?: Record<string, unknown>;
    layout?: Record<string, unknown>;
    filter?: unknown[];
    [key: string]: unknown;
  }

  export interface GeoJSONSource {
    setData(data: object): void;
  }

  export class LngLat {
    constructor(lng: number, lat: number);
    lng: number;
    lat: number;
    distanceTo(other: LngLat): number;
  }

  export interface MapMouseEvent {
    lngLat: LngLat;
    point: { x: number; y: number };
    features?: Array<{
      properties: Record<string, unknown>;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }

  // biome-ignore lint/suspicious/noShadowRestrictedNames: maplibre-gl exports a class named Map
  export class Map {
    constructor(options: MapOptions);
    on(event: string, callback: (e: MapMouseEvent) => void): this;
    on(
      event: string,
      layer: string,
      callback: (e: MapMouseEvent) => void,
    ): this;
    off(event: string, callback: (e: MapMouseEvent) => void): this;
    remove(): void;
    addSource(id: string, source: object): this;
    removeSource(id: string): this;
    getSource(id: string): GeoJSONSource | undefined;
    addLayer(layer: LayerSpecification, beforeId?: string): this;
    removeLayer(id: string): this;
    getLayer(id: string): LayerSpecification | undefined;
    setLayoutProperty(layer: string, name: string, value: unknown): this;
    setPaintProperty(layer: string, name: string, value: unknown): this;
    setStyle(style: string | object): this;
    setCenter(center: [number, number]): this;
    setZoom(zoom: number): this;
    getZoom(): number;
    getCenter(): LngLat;
    getBounds(): {
      getNorth(): number;
      getSouth(): number;
      getEast(): number;
      getWest(): number;
    };
    fitBounds(
      bounds: [[number, number], [number, number]],
      options?: object,
    ): this;
    flyTo(options: object): this;
    easeTo(options: object): this;
    queryRenderedFeatures(
      point?: unknown,
      options?: object,
    ): Array<{ properties: Record<string, unknown> }>;
    loaded(): boolean;
    isStyleLoaded(): boolean;
    getCanvas(): HTMLCanvasElement;
    resize(): this;
  }

  export class Marker {
    constructor(options?: MarkerOptions);
    setLngLat(lngLat: [number, number] | LngLatLike): this;
    getLngLat(): LngLat;
    addTo(map: Map): this;
    remove(): void;
    setDraggable(draggable: boolean): this;
    on(event: string, callback: () => void): this;
    getElement(): HTMLElement;
    setPopup(popup: Popup): this;
  }

  export class Popup {
    constructor(options?: PopupOptions);
    setLngLat(lngLat: [number, number] | LngLatLike): this;
    setHTML(html: string): this;
    setText(text: string): this;
    addTo(map: Map): this;
    remove(): void;
    isOpen(): boolean;
  }

  export class NavigationControl {
    constructor(options?: object);
  }

  export class GeolocateControl {
    constructor(options?: object);
    on(event: string, callback: (e?: unknown) => void): this;
    trigger(): boolean;
  }

  export class ScaleControl {
    constructor(options?: object);
  }

  // biome-ignore lint/suspicious/noShadowRestrictedNames: namespace alias for maplibre-gl
  namespace maplibregl {
    type GeoJSONSource = import("maplibre-gl").GeoJSONSource;
    type Popup = import("maplibre-gl").Popup;
    type Marker = import("maplibre-gl").Marker;
    type Map = import("maplibre-gl").Map;
    type LngLat = import("maplibre-gl").LngLat;
  }

  const _default: {
    Map: typeof Map;
    Marker: typeof Marker;
    Popup: typeof Popup;
    NavigationControl: typeof NavigationControl;
    GeolocateControl: typeof GeolocateControl;
    ScaleControl: typeof ScaleControl;
    LngLat: typeof LngLat;
  };

  export default _default;
}

// Allow `maplibregl` as a namespace when imported as default
declare namespace maplibregl {
  type GeoJSONSource = import("maplibre-gl").GeoJSONSource;
  type Popup = import("maplibre-gl").Popup;
  type Marker = import("maplibre-gl").Marker;
  // biome-ignore lint/suspicious/noShadowRestrictedNames: maplibre-gl Map type alias
  type Map = import("maplibre-gl").Map;
  type LngLat = import("maplibre-gl").LngLat;
  type MapMouseEvent = import("maplibre-gl").MapMouseEvent;
}
