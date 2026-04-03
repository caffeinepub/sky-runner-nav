// GeoJSON namespace type declarations
declare namespace GeoJSON {
  type GeoJsonTypes =
    | "Point"
    | "MultiPoint"
    | "LineString"
    | "MultiLineString"
    | "Polygon"
    | "MultiPolygon"
    | "GeometryCollection"
    | "Feature"
    | "FeatureCollection";

  interface GeoJsonObject {
    type: GeoJsonTypes;
    bbox?: BBox;
  }

  type BBox =
    | [number, number, number, number]
    | [number, number, number, number, number, number];

  type Position = number[];

  interface Point extends GeoJsonObject {
    type: "Point";
    coordinates: Position;
  }

  interface MultiPoint extends GeoJsonObject {
    type: "MultiPoint";
    coordinates: Position[];
  }

  interface LineString extends GeoJsonObject {
    type: "LineString";
    coordinates: Position[];
  }

  interface MultiLineString extends GeoJsonObject {
    type: "MultiLineString";
    coordinates: Position[][];
  }

  interface Polygon extends GeoJsonObject {
    type: "Polygon";
    coordinates: Position[][];
  }

  interface MultiPolygon extends GeoJsonObject {
    type: "MultiPolygon";
    coordinates: Position[][][];
  }

  type Geometry =
    | Point
    | MultiPoint
    | LineString
    | MultiLineString
    | Polygon
    | MultiPolygon
    | GeometryCollection;

  interface GeometryCollection extends GeoJsonObject {
    type: "GeometryCollection";
    geometries: Geometry[];
  }

  type GeoJsonProperties = Record<string, unknown> | null;

  interface Feature<G extends Geometry | null = Geometry, P = GeoJsonProperties>
    extends GeoJsonObject {
    type: "Feature";
    geometry: G;
    id?: string | number;
    properties: P;
  }

  interface FeatureCollection<
    G extends Geometry | null = Geometry,
    P = GeoJsonProperties,
  > extends GeoJsonObject {
    type: "FeatureCollection";
    features: Array<Feature<G, P>>;
  }
}
