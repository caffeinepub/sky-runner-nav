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

// Major airports with 60-mile (96.56 km) warning radius — at least one per US state and Canadian province
export const AIRPORT_WARNING_ZONES = [
  // USA - Major hubs
  { name: "JFK International", lat: 40.6413, lng: -73.7781 },
  { name: "LAX International", lat: 33.9425, lng: -118.4081 },
  { name: "O'Hare International", lat: 41.9742, lng: -87.9073 },
  { name: "Dallas/Fort Worth", lat: 32.8998, lng: -97.0403 },
  { name: "Denver International", lat: 39.8561, lng: -104.6737 },
  { name: "Atlanta Hartsfield", lat: 33.6407, lng: -84.4277 },
  { name: "Miami International", lat: 25.7959, lng: -80.287 },
  { name: "Seattle-Tacoma", lat: 47.4502, lng: -122.3088 },
  { name: "San Francisco Intl", lat: 37.6213, lng: -122.379 },
  { name: "McCarran Las Vegas", lat: 36.08, lng: -115.1522 },
  { name: "Phoenix Sky Harbor", lat: 33.4373, lng: -112.0078 },
  { name: "Newark Liberty", lat: 40.6895, lng: -74.1745 },
  { name: "George Bush Houston", lat: 29.9902, lng: -95.3368 },
  { name: "Minneapolis-St Paul", lat: 44.8848, lng: -93.2223 },
  { name: "Boston Logan", lat: 42.3656, lng: -71.0096 },
  { name: "Orlando International", lat: 28.4312, lng: -81.308 },
  { name: "Charlotte Douglas", lat: 35.214, lng: -80.9431 },
  { name: "Detroit Metropolitan", lat: 42.2124, lng: -83.3534 },
  { name: "Philadelphia Intl", lat: 39.8744, lng: -75.2424 },
  { name: "Salt Lake City Intl", lat: 40.7899, lng: -111.9791 },
  { name: "Portland Intl", lat: 45.5898, lng: -122.5951 },
  { name: "Dulles Intl (DC)", lat: 38.9445, lng: -77.4558 },
  { name: "Reagan National (DC)", lat: 38.8521, lng: -77.0377 },
  { name: "St. Louis Lambert", lat: 38.7487, lng: -90.37 },
  { name: "Kansas City Intl", lat: 39.2976, lng: -94.7139 },
  { name: "Nashville Intl", lat: 36.1245, lng: -86.6782 },
  { name: "Baltimore/Washington", lat: 39.1754, lng: -76.6683 },
  { name: "San Diego Intl", lat: 32.7338, lng: -117.1933 },
  { name: "Tampa Intl", lat: 27.9755, lng: -82.5332 },
  { name: "Anchorage Intl", lat: 61.1743, lng: -149.9964 },
  { name: "Honolulu Intl", lat: 21.3245, lng: -157.9251 },
  // USA - Additional states (one per state not yet covered)
  { name: "Birmingham-Shuttlesworth (AL)", lat: 33.5629, lng: -86.7535 },
  { name: "Bill and Hillary Clinton Natl (AR)", lat: 34.7294, lng: -92.2243 },
  { name: "Bradley Intl (CT)", lat: 41.9389, lng: -72.6832 },
  { name: "Wilmington Airport (DE)", lat: 39.6787, lng: -75.6065 },
  { name: "Boise Airport (ID)", lat: 43.5644, lng: -116.2228 },
  { name: "Indianapolis Intl (IN)", lat: 39.7173, lng: -86.2944 },
  { name: "Des Moines Intl (IA)", lat: 41.5341, lng: -93.6631 },
  { name: "Wichita Eisenhower Natl (KS)", lat: 37.6499, lng: -97.4331 },
  { name: "Louisville Muhammad Ali Intl (KY)", lat: 38.1744, lng: -85.736 },
  { name: "Louis Armstrong New Orleans (LA)", lat: 29.9934, lng: -90.258 },
  { name: "Portland Intl Jetport (ME)", lat: 43.6462, lng: -70.3093 },
  { name: "Jackson-Medgar Wiley Evers (MS)", lat: 32.3112, lng: -90.0759 },
  { name: "Billings Logan Intl (MT)", lat: 45.8077, lng: -108.5428 },
  { name: "Eppley Airfield (NE)", lat: 41.3032, lng: -95.894 },
  { name: "Manchester-Boston Regional (NH)", lat: 42.9326, lng: -71.4357 },
  { name: "Albuquerque Intl Sunport (NM)", lat: 35.0402, lng: -106.609 },
  { name: "Hector Intl Airport (ND)", lat: 46.9207, lng: -96.8158 },
  { name: "John Glenn Columbus Intl (OH)", lat: 39.998, lng: -82.8919 },
  { name: "Will Rogers World Airport (OK)", lat: 35.3931, lng: -97.6007 },
  { name: "TF Green Airport (RI)", lat: 41.7243, lng: -71.428 },
  { name: "Columbia Metropolitan (SC)", lat: 33.9388, lng: -81.1195 },
  { name: "Rapid City Regional (SD)", lat: 44.0453, lng: -103.0574 },
  { name: "Burlington Intl (VT)", lat: 44.472, lng: -73.1533 },
  { name: "Richmond Intl (VA)", lat: 37.5052, lng: -77.3197 },
  { name: "Yeager Airport (WV)", lat: 38.3731, lng: -81.5932 },
  { name: "Milwaukee Mitchell Intl (WI)", lat: 42.9472, lng: -87.8966 },
  { name: "Jackson Hole Airport (WY)", lat: 43.6073, lng: -110.7377 },
  // Canada
  { name: "Toronto Pearson", lat: 43.6777, lng: -79.6248 },
  { name: "Vancouver Intl", lat: 49.1947, lng: -123.1792 },
  { name: "Montreal-Trudeau", lat: 45.4706, lng: -73.7408 },
  { name: "Calgary Intl", lat: 51.1225, lng: -114.0133 },
  { name: "Edmonton Intl", lat: 53.3097, lng: -113.5827 },
  { name: "Ottawa Macdonald-Cartier", lat: 45.3225, lng: -75.6692 },
  {
    name: "Winnipeg James Armstrong Richardson (MB)",
    lat: 49.91,
    lng: -97.2398,
  },
  { name: "Regina Intl (SK)", lat: 50.4319, lng: -104.6658 },
  { name: "Fredericton Intl (NB)", lat: 45.8689, lng: -66.5373 },
  { name: "Halifax Stanfield Intl (NS)", lat: 44.8808, lng: -63.5086 },
  { name: "Charlottetown Airport (PEI)", lat: 46.2903, lng: -63.1211 },
  { name: "St. John's Intl (NL)", lat: 47.6186, lng: -52.7519 },
  { name: "Erik Nielsen Whitehorse Intl (YT)", lat: 60.7096, lng: -135.0675 },
  { name: "Yellowknife Airport (NT)", lat: 62.4628, lng: -114.4401 },
  { name: "Iqaluit Airport (NU)", lat: 63.7564, lng: -68.5558 },
  { name: "Kelowna Intl (BC Interior)", lat: 49.9561, lng: -119.3778 },
  // Mexico
  { name: "Mexico City Intl", lat: 19.4363, lng: -99.0721 },
  { name: "Cancún Intl", lat: 21.0365, lng: -86.8771 },
  { name: "Guadalajara Intl", lat: 20.5218, lng: -103.3111 },
  // Europe
  { name: "Heathrow Airport", lat: 51.47, lng: -0.4543 },
  { name: "Paris CDG", lat: 49.0097, lng: 2.5479 },
  { name: "Frankfurt Intl", lat: 50.0379, lng: 8.5622 },
  // Restricted / Military
  { name: "Pentagon (DC)", lat: 38.8719, lng: -77.0563 },
  { name: "Area 51", lat: 37.235, lng: -115.811 },
  { name: "Fort Bragg", lat: 35.1396, lng: -79.0063 },
  { name: "Naval Station Norfolk", lat: 36.9365, lng: -76.3212 },
  { name: "Andrews AFB", lat: 38.8108, lng: -76.8667 },
];

// Country border reference points — spaced ~60 miles apart along major borders
export const BORDER_WARNING_POINTS = [
  // US–Canada border (west → east)
  { name: "US–Canada Border (Pacific)", lat: 49.0, lng: -122.75 },
  { name: "US–Canada Border (Cascade)", lat: 49.0, lng: -121.5 },
  { name: "US–Canada Border (Okanogan)", lat: 49.0, lng: -119.5 },
  { name: "US–Canada Border (Columbia)", lat: 49.0, lng: -117.5 },
  { name: "US–Canada Border (Idaho)", lat: 49.0, lng: -116.0 },
  { name: "US–Canada Border (Montana W)", lat: 49.0, lng: -114.0 },
  { name: "US–Canada Border (Montana C)", lat: 49.0, lng: -111.5 },
  { name: "US–Canada Border (Montana E)", lat: 49.0, lng: -109.0 },
  { name: "US–Canada Border (N Dakota W)", lat: 49.0, lng: -104.0 },
  { name: "US–Canada Border (N Dakota C)", lat: 49.0, lng: -101.0 },
  { name: "US–Canada Border (N Dakota E)", lat: 49.0, lng: -97.5 },
  { name: "US–Canada Border (Minnesota)", lat: 49.0, lng: -96.5 },
  { name: "US–Canada Border (Lake of Woods)", lat: 49.4, lng: -95.2 },
  { name: "US–Canada Border (Lake Superior)", lat: 47.5, lng: -90.0 },
  { name: "US–Canada Border (St. Mary's R.)", lat: 46.5, lng: -84.5 },
  { name: "US–Canada Border (Lake Ontario)", lat: 43.5, lng: -79.0 },
  { name: "US–Canada Border (St. Lawrence)", lat: 45.0, lng: -74.7 },
  { name: "US–Canada Border (Vermont)", lat: 45.0, lng: -72.5 },
  { name: "US–Canada Border (New Hampshire)", lat: 45.0, lng: -71.5 },
  { name: "US–Canada Border (Maine W)", lat: 45.8, lng: -70.0 },
  { name: "US–Canada Border (Maine E)", lat: 47.0, lng: -68.0 },
  // US–Mexico border (west → east)
  { name: "US–Mexico Border (Pacific)", lat: 32.53, lng: -117.1 },
  { name: "US–Mexico Border (Tecate)", lat: 32.57, lng: -116.1 },
  { name: "US–Mexico Border (Mexicali)", lat: 32.7, lng: -115.5 },
  { name: "US–Mexico Border (Yuma)", lat: 32.7, lng: -114.6 },
  { name: "US–Mexico Border (Nogales)", lat: 31.34, lng: -110.95 },
  { name: "US–Mexico Border (Douglas)", lat: 31.34, lng: -109.55 },
  { name: "US–Mexico Border (Columbus)", lat: 31.83, lng: -107.64 },
  { name: "US–Mexico Border (El Paso)", lat: 31.78, lng: -106.42 },
  { name: "US–Mexico Border (Big Bend)", lat: 29.35, lng: -103.5 },
  { name: "US–Mexico Border (Del Rio)", lat: 29.37, lng: -100.9 },
  { name: "US–Mexico Border (Eagle Pass)", lat: 28.7, lng: -100.5 },
  { name: "US–Mexico Border (Laredo)", lat: 27.5, lng: -99.5 },
  { name: "US–Mexico Border (McAllen)", lat: 26.2, lng: -98.3 },
  { name: "US–Mexico Border (Brownsville)", lat: 25.9, lng: -97.5 },
  // Major European borders
  { name: "France–Spain Border (Atlantic)", lat: 43.35, lng: -1.75 },
  { name: "France–Spain Border (Pyrenees C)", lat: 42.7, lng: 0.65 },
  { name: "France–Spain Border (Mediterranean)", lat: 42.5, lng: 3.1 },
  { name: "France–Germany Border", lat: 48.0, lng: 7.55 },
  { name: "France–Belgium Border", lat: 50.3, lng: 3.5 },
  { name: "Germany–Poland Border", lat: 52.0, lng: 14.55 },
  { name: "Germany–Austria Border", lat: 47.6, lng: 12.9 },
  { name: "Ukraine–Russia Border", lat: 51.0, lng: 39.0 },
  { name: "Ukraine–Russia Border (S)", lat: 47.5, lng: 38.5 },
];

// Comprehensive North America airline routes
const PLANE_ROUTES = [
  // ─── Transatlantic ───
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
    from: [8.5492, 47.4647] as [number, number],
    to: [-73.7781, 40.6413] as [number, number],
    name: "ZRH-JFK",
  },
  // ─── USA Domestic ───
  {
    from: [-73.7781, 40.6413] as [number, number],
    to: [-118.4081, 33.9425] as [number, number],
    name: "JFK-LAX",
  },
  {
    from: [-73.7781, 40.6413] as [number, number],
    to: [-87.9073, 41.9742] as [number, number],
    name: "JFK-ORD",
  },
  {
    from: [-73.7781, 40.6413] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "JFK-ATL",
  },
  {
    from: [-73.7781, 40.6413] as [number, number],
    to: [-80.287, 25.7959] as [number, number],
    name: "JFK-MIA",
  },
  {
    from: [-73.7781, 40.6413] as [number, number],
    to: [-122.379, 37.6213] as [number, number],
    name: "JFK-SFO",
  },
  {
    from: [-73.7781, 40.6413] as [number, number],
    to: [-95.3368, 29.9902] as [number, number],
    name: "JFK-IAH",
  },
  {
    from: [-118.4081, 33.9425] as [number, number],
    to: [-87.9073, 41.9742] as [number, number],
    name: "LAX-ORD",
  },
  {
    from: [-118.4081, 33.9425] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "LAX-ATL",
  },
  {
    from: [-118.4081, 33.9425] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "LAX-DFW",
  },
  {
    from: [-118.4081, 33.9425] as [number, number],
    to: [-104.6737, 39.8561] as [number, number],
    name: "LAX-DEN",
  },
  {
    from: [-118.4081, 33.9425] as [number, number],
    to: [-122.3088, 47.4502] as [number, number],
    name: "LAX-SEA",
  },
  {
    from: [-118.4081, 33.9425] as [number, number],
    to: [-80.287, 25.7959] as [number, number],
    name: "LAX-MIA",
  },
  {
    from: [-118.4081, 33.9425] as [number, number],
    to: [-80.9431, 35.214] as [number, number],
    name: "LAX-CLT",
  },
  {
    from: [-87.9073, 41.9742] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "ORD-ATL",
  },
  {
    from: [-87.9073, 41.9742] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "ORD-DFW",
  },
  {
    from: [-87.9073, 41.9742] as [number, number],
    to: [-104.6737, 39.8561] as [number, number],
    name: "ORD-DEN",
  },
  {
    from: [-87.9073, 41.9742] as [number, number],
    to: [-122.379, 37.6213] as [number, number],
    name: "ORD-SFO",
  },
  {
    from: [-87.9073, 41.9742] as [number, number],
    to: [-80.287, 25.7959] as [number, number],
    name: "ORD-MIA",
  },
  {
    from: [-87.9073, 41.9742] as [number, number],
    to: [-71.0096, 42.3656] as [number, number],
    name: "ORD-BOS",
  },
  {
    from: [-84.4277, 33.6407] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "ATL-DFW",
  },
  {
    from: [-84.4277, 33.6407] as [number, number],
    to: [-80.287, 25.7959] as [number, number],
    name: "ATL-MIA",
  },
  {
    from: [-84.4277, 33.6407] as [number, number],
    to: [-104.6737, 39.8561] as [number, number],
    name: "ATL-DEN",
  },
  {
    from: [-84.4277, 33.6407] as [number, number],
    to: [-122.3088, 47.4502] as [number, number],
    name: "ATL-SEA",
  },
  {
    from: [-84.4277, 33.6407] as [number, number],
    to: [-112.0078, 33.4373] as [number, number],
    name: "ATL-PHX",
  },
  {
    from: [-84.4277, 33.6407] as [number, number],
    to: [-86.6782, 36.1245] as [number, number],
    name: "ATL-BNA",
  },
  {
    from: [-84.4277, 33.6407] as [number, number],
    to: [-80.9431, 35.214] as [number, number],
    name: "ATL-CLT",
  },
  {
    from: [-97.0403, 32.8998] as [number, number],
    to: [-104.6737, 39.8561] as [number, number],
    name: "DFW-DEN",
  },
  {
    from: [-97.0403, 32.8998] as [number, number],
    to: [-122.379, 37.6213] as [number, number],
    name: "DFW-SFO",
  },
  {
    from: [-97.0403, 32.8998] as [number, number],
    to: [-122.3088, 47.4502] as [number, number],
    name: "DFW-SEA",
  },
  {
    from: [-97.0403, 32.8998] as [number, number],
    to: [-112.0078, 33.4373] as [number, number],
    name: "DFW-PHX",
  },
  {
    from: [-97.0403, 32.8998] as [number, number],
    to: [-80.287, 25.7959] as [number, number],
    name: "DFW-MIA",
  },
  {
    from: [-97.0403, 32.8998] as [number, number],
    to: [-95.3368, 29.9902] as [number, number],
    name: "DFW-IAH",
  },
  {
    from: [-104.6737, 39.8561] as [number, number],
    to: [-122.379, 37.6213] as [number, number],
    name: "DEN-SFO",
  },
  {
    from: [-104.6737, 39.8561] as [number, number],
    to: [-122.3088, 47.4502] as [number, number],
    name: "DEN-SEA",
  },
  {
    from: [-104.6737, 39.8561] as [number, number],
    to: [-112.0078, 33.4373] as [number, number],
    name: "DEN-PHX",
  },
  {
    from: [-104.6737, 39.8561] as [number, number],
    to: [-71.0096, 42.3656] as [number, number],
    name: "DEN-BOS",
  },
  {
    from: [-122.379, 37.6213] as [number, number],
    to: [-122.3088, 47.4502] as [number, number],
    name: "SFO-SEA",
  },
  {
    from: [-122.379, 37.6213] as [number, number],
    to: [-112.0078, 33.4373] as [number, number],
    name: "SFO-PHX",
  },
  {
    from: [-122.379, 37.6213] as [number, number],
    to: [-80.287, 25.7959] as [number, number],
    name: "SFO-MIA",
  },
  {
    from: [-122.379, 37.6213] as [number, number],
    to: [-71.0096, 42.3656] as [number, number],
    name: "SFO-BOS",
  },
  {
    from: [-122.379, 37.6213] as [number, number],
    to: [-77.4558, 38.9445] as [number, number],
    name: "SFO-IAD",
  },
  {
    from: [-122.379, 37.6213] as [number, number],
    to: [-83.3534, 42.2124] as [number, number],
    name: "SFO-DTW",
  },
  {
    from: [-122.3088, 47.4502] as [number, number],
    to: [-112.0078, 33.4373] as [number, number],
    name: "SEA-PHX",
  },
  {
    from: [-122.3088, 47.4502] as [number, number],
    to: [-80.287, 25.7959] as [number, number],
    name: "SEA-MIA",
  },
  {
    from: [-122.3088, 47.4502] as [number, number],
    to: [-71.0096, 42.3656] as [number, number],
    name: "SEA-BOS",
  },
  {
    from: [-80.287, 25.7959] as [number, number],
    to: [-71.0096, 42.3656] as [number, number],
    name: "MIA-BOS",
  },
  {
    from: [-80.287, 25.7959] as [number, number],
    to: [-81.308, 28.4312] as [number, number],
    name: "MIA-MCO",
  },
  {
    from: [-80.287, 25.7959] as [number, number],
    to: [-80.9431, 35.214] as [number, number],
    name: "MIA-CLT",
  },
  {
    from: [-71.0096, 42.3656] as [number, number],
    to: [-77.4558, 38.9445] as [number, number],
    name: "BOS-IAD",
  },
  {
    from: [-71.0096, 42.3656] as [number, number],
    to: [-75.2424, 39.8744] as [number, number],
    name: "BOS-PHL",
  },
  {
    from: [-71.0096, 42.3656] as [number, number],
    to: [-80.9431, 35.214] as [number, number],
    name: "BOS-CLT",
  },
  {
    from: [-77.4558, 38.9445] as [number, number],
    to: [-80.9431, 35.214] as [number, number],
    name: "IAD-CLT",
  },
  {
    from: [-77.4558, 38.9445] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "IAD-DFW",
  },
  {
    from: [-81.308, 28.4312] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "MCO-ATL",
  },
  {
    from: [-81.308, 28.4312] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "MCO-DFW",
  },
  {
    from: [-81.308, 28.4312] as [number, number],
    to: [-87.9073, 41.9742] as [number, number],
    name: "MCO-ORD",
  },
  {
    from: [-82.5332, 27.9755] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "TPA-ATL",
  },
  {
    from: [-82.5332, 27.9755] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "TPA-DFW",
  },
  {
    from: [-93.2223, 44.8848] as [number, number],
    to: [-87.9073, 41.9742] as [number, number],
    name: "MSP-ORD",
  },
  {
    from: [-93.2223, 44.8848] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "MSP-DFW",
  },
  {
    from: [-93.2223, 44.8848] as [number, number],
    to: [-122.3088, 47.4502] as [number, number],
    name: "MSP-SEA",
  },
  {
    from: [-93.2223, 44.8848] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "MSP-ATL",
  },
  {
    from: [-83.3534, 42.2124] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "DTW-ATL",
  },
  {
    from: [-83.3534, 42.2124] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "DTW-DFW",
  },
  {
    from: [-83.3534, 42.2124] as [number, number],
    to: [-122.379, 37.6213] as [number, number],
    name: "DTW-SFO",
  },
  {
    from: [-75.2424, 39.8744] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "PHL-ATL",
  },
  {
    from: [-75.2424, 39.8744] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "PHL-DFW",
  },
  {
    from: [-112.0078, 33.4373] as [number, number],
    to: [-115.1522, 36.08] as [number, number],
    name: "PHX-LAS",
  },
  {
    from: [-112.0078, 33.4373] as [number, number],
    to: [-95.3368, 29.9902] as [number, number],
    name: "PHX-IAH",
  },
  {
    from: [-115.1522, 36.08] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "LAS-ATL",
  },
  {
    from: [-115.1522, 36.08] as [number, number],
    to: [-87.9073, 41.9742] as [number, number],
    name: "LAS-ORD",
  },
  {
    from: [-115.1522, 36.08] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "LAS-DFW",
  },
  {
    from: [-115.1522, 36.08] as [number, number],
    to: [-80.287, 25.7959] as [number, number],
    name: "LAS-MIA",
  },
  {
    from: [-95.3368, 29.9902] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "IAH-ATL",
  },
  {
    from: [-95.3368, 29.9902] as [number, number],
    to: [-122.379, 37.6213] as [number, number],
    name: "IAH-SFO",
  },
  {
    from: [-86.6782, 36.1245] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "BNA-ATL",
  },
  {
    from: [-86.6782, 36.1245] as [number, number],
    to: [-87.9073, 41.9742] as [number, number],
    name: "BNA-ORD",
  },
  {
    from: [-80.9431, 35.214] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "CLT-ATL",
  },
  {
    from: [-80.9431, 35.214] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "CLT-DFW",
  },
  {
    from: [-90.37, 38.7487] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "STL-ATL",
  },
  {
    from: [-90.37, 38.7487] as [number, number],
    to: [-87.9073, 41.9742] as [number, number],
    name: "STL-ORD",
  },
  {
    from: [-94.7139, 39.2976] as [number, number],
    to: [-87.9073, 41.9742] as [number, number],
    name: "MCI-ORD",
  },
  {
    from: [-94.7139, 39.2976] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "MCI-DFW",
  },
  {
    from: [-149.9964, 61.1743] as [number, number],
    to: [-122.3088, 47.4502] as [number, number],
    name: "ANC-SEA",
  },
  {
    from: [-149.9964, 61.1743] as [number, number],
    to: [-118.4081, 33.9425] as [number, number],
    name: "ANC-LAX",
  },
  {
    from: [-157.9251, 21.3245] as [number, number],
    to: [-118.4081, 33.9425] as [number, number],
    name: "HNL-LAX",
  },
  {
    from: [-157.9251, 21.3245] as [number, number],
    to: [-122.3088, 47.4502] as [number, number],
    name: "HNL-SEA",
  },
  {
    from: [-157.9251, 21.3245] as [number, number],
    to: [-87.9073, 41.9742] as [number, number],
    name: "HNL-ORD",
  },
  {
    from: [-111.9791, 40.7899] as [number, number],
    to: [-87.9073, 41.9742] as [number, number],
    name: "SLC-ORD",
  },
  {
    from: [-111.9791, 40.7899] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "SLC-DFW",
  },
  {
    from: [-111.9791, 40.7899] as [number, number],
    to: [-118.4081, 33.9425] as [number, number],
    name: "SLC-LAX",
  },
  {
    from: [-117.1933, 32.7338] as [number, number],
    to: [-118.4081, 33.9425] as [number, number],
    name: "SAN-LAX",
  },
  {
    from: [-117.1933, 32.7338] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "SAN-ATL",
  },
  {
    from: [-117.1933, 32.7338] as [number, number],
    to: [-97.0403, 32.8998] as [number, number],
    name: "SAN-DFW",
  },
  {
    from: [-122.5951, 45.5898] as [number, number],
    to: [-84.4277, 33.6407] as [number, number],
    name: "PDX-ATL",
  },
  {
    from: [-122.5951, 45.5898] as [number, number],
    to: [-87.9073, 41.9742] as [number, number],
    name: "PDX-ORD",
  },
  // ─── Canada Domestic ───
  {
    from: [-79.6248, 43.6777] as [number, number],
    to: [-123.1792, 49.1947] as [number, number],
    name: "YYZ-YVR",
  },
  {
    from: [-79.6248, 43.6777] as [number, number],
    to: [-73.7408, 45.4706] as [number, number],
    name: "YYZ-YUL",
  },
  {
    from: [-79.6248, 43.6777] as [number, number],
    to: [-114.0133, 51.1225] as [number, number],
    name: "YYZ-YYC",
  },
  {
    from: [-79.6248, 43.6777] as [number, number],
    to: [-113.5827, 53.3097] as [number, number],
    name: "YYZ-YEG",
  },
  {
    from: [-79.6248, 43.6777] as [number, number],
    to: [-75.6692, 45.3225] as [number, number],
    name: "YYZ-YOW",
  },
  {
    from: [-123.1792, 49.1947] as [number, number],
    to: [-73.7408, 45.4706] as [number, number],
    name: "YVR-YUL",
  },
  {
    from: [-123.1792, 49.1947] as [number, number],
    to: [-114.0133, 51.1225] as [number, number],
    name: "YVR-YYC",
  },
  {
    from: [-114.0133, 51.1225] as [number, number],
    to: [-73.7408, 45.4706] as [number, number],
    name: "YYC-YUL",
  },
  {
    from: [-114.0133, 51.1225] as [number, number],
    to: [-113.5827, 53.3097] as [number, number],
    name: "YYC-YEG",
  },
  {
    from: [-97.2398, 49.91] as [number, number],
    to: [-79.6248, 43.6777] as [number, number],
    name: "YWG-YYZ",
  },
  {
    from: [-97.2398, 49.91] as [number, number],
    to: [-114.0133, 51.1225] as [number, number],
    name: "YWG-YYC",
  },
  {
    from: [-104.6658, 50.4319] as [number, number],
    to: [-79.6248, 43.6777] as [number, number],
    name: "YQR-YYZ",
  },
  {
    from: [-63.5086, 44.8808] as [number, number],
    to: [-79.6248, 43.6777] as [number, number],
    name: "YHZ-YYZ",
  },
  {
    from: [-52.7519, 47.6186] as [number, number],
    to: [-73.7408, 45.4706] as [number, number],
    name: "YYT-YUL",
  },
  // ─── USA-Canada Cross-border ───
  {
    from: [-79.6248, 43.6777] as [number, number],
    to: [-73.7781, 40.6413] as [number, number],
    name: "YYZ-JFK",
  },
  {
    from: [-79.6248, 43.6777] as [number, number],
    to: [-87.9073, 41.9742] as [number, number],
    name: "YYZ-ORD",
  },
  {
    from: [-123.1792, 49.1947] as [number, number],
    to: [-122.3088, 47.4502] as [number, number],
    name: "YVR-SEA",
  },
  {
    from: [-123.1792, 49.1947] as [number, number],
    to: [-118.4081, 33.9425] as [number, number],
    name: "YVR-LAX",
  },
  {
    from: [-73.7408, 45.4706] as [number, number],
    to: [-73.7781, 40.6413] as [number, number],
    name: "YUL-JFK",
  },
  {
    from: [-63.5086, 44.8808] as [number, number],
    to: [-71.0096, 42.3656] as [number, number],
    name: "YHZ-BOS",
  },
  {
    from: [-97.2398, 49.91] as [number, number],
    to: [-93.2223, 44.8848] as [number, number],
    name: "YWG-MSP",
  },
  // ─── USA-Mexico ───
  {
    from: [-87.9073, 41.9742] as [number, number],
    to: [-99.0721, 19.4363] as [number, number],
    name: "ORD-MEX",
  },
  {
    from: [-97.0403, 32.8998] as [number, number],
    to: [-99.0721, 19.4363] as [number, number],
    name: "DFW-MEX",
  },
  {
    from: [-118.4081, 33.9425] as [number, number],
    to: [-99.0721, 19.4363] as [number, number],
    name: "LAX-MEX",
  },
  {
    from: [-73.7781, 40.6413] as [number, number],
    to: [-86.8771, 21.0365] as [number, number],
    name: "JFK-CUN",
  },
  {
    from: [-84.4277, 33.6407] as [number, number],
    to: [-86.8771, 21.0365] as [number, number],
    name: "ATL-CUN",
  },
  {
    from: [-87.9073, 41.9742] as [number, number],
    to: [-86.8771, 21.0365] as [number, number],
    name: "ORD-CUN",
  },
  {
    from: [-97.0403, 32.8998] as [number, number],
    to: [-86.8771, 21.0365] as [number, number],
    name: "DFW-CUN",
  },
  {
    from: [-95.3368, 29.9902] as [number, number],
    to: [-99.0721, 19.4363] as [number, number],
    name: "IAH-MEX",
  },
  // ─── Caribbean ───
  {
    from: [-73.7781, 40.6413] as [number, number],
    to: [-79.6248, 43.6777] as [number, number],
    name: "JFK-YYZ",
  },
  {
    from: [-80.287, 25.7959] as [number, number],
    to: [-79.5225, 8.9336] as [number, number],
    name: "MIA-PTY",
  },
  {
    from: [-80.287, 25.7959] as [number, number],
    to: [-66.0036, 18.4394] as [number, number],
    name: "MIA-SJU",
  },
  {
    from: [-73.7781, 40.6413] as [number, number],
    to: [-66.0036, 18.4394] as [number, number],
    name: "JFK-SJU",
  },
];

/** Haversine distance in miles between two [lng, lat] points */
function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const mapLoadedRef = useRef(false);
  const overlaysRef = useRef(overlays);
  const overlayDataRef = useRef(overlayData);
  const staticOverlaysRef = useRef(staticOverlays);
  const warnedZonesRef = useRef<Set<string>>(new Set());
  const warningPopupRef = useRef<maplibregl.Popup | null>(null);
  const countryBordersLoadedRef = useRef(false);

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

      // Warning rings — airport 60-mile radius circles
      const RADIUS_KM = 96.56; // 60 miles
      map.addSource("warning-rings", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: AIRPORT_WARNING_ZONES.map((loc) =>
            createCircle([loc.lng, loc.lat], RADIUS_KM),
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
          "line-opacity": 0.6,
        },
        layout: { visibility: "none" },
      });

      // Airport center dots (visible when warning-rings active)
      map.addSource("airport-dots", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: AIRPORT_WARNING_ZONES.map((loc) => ({
            type: "Feature" as const,
            properties: { name: loc.name },
            geometry: {
              type: "Point" as const,
              coordinates: [loc.lng, loc.lat],
            },
          })),
        },
      });
      map.addLayer({
        id: "airport-dots-circle",
        type: "circle",
        source: "airport-dots",
        paint: {
          "circle-radius": 5,
          "circle-color": "#ff4444",
          "circle-opacity": 0.85,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffcccc",
        },
        layout: { visibility: "none" },
      });
      map.addLayer({
        id: "airport-dots-label",
        type: "symbol",
        source: "airport-dots",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 10,
          "text-anchor": "top",
          "text-offset": [0, 0.8],
          visibility: "none",
        },
        paint: {
          "text-color": "#ff8888",
          "text-halo-color": "rgba(0,0,0,0.8)",
          "text-halo-width": 1.5,
        },
      });

      // Country fill source — loaded from GeoJSON, used for fill + zone layers
      map.addSource("country-borders-fill", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      // Subtle fill to shade each country
      map.addLayer({
        id: "country-borders-country-fill",
        type: "fill",
        source: "country-borders-fill",
        paint: { "fill-color": "#7700cc", "fill-opacity": 0.04 },
        layout: { visibility: "none" },
      });
      // Wide glow band representing the ~60-mile border zone
      map.addLayer({
        id: "country-borders-zone-glow",
        type: "line",
        source: "country-borders-fill",
        paint: {
          "line-color": "#bb44ff",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            60,
            5,
            30,
            8,
            16,
            12,
            8,
          ],
          "line-opacity": 0.18,
          "line-blur": 8,
        },
        layout: { visibility: "none" },
      });
      // Dashed outline ring at the edge of the 60-mile zone
      map.addLayer({
        id: "country-borders-zone-dash",
        type: "line",
        source: "country-borders-fill",
        paint: {
          "line-color": "#cc66ff",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            60,
            5,
            30,
            8,
            16,
            12,
            8,
          ],
          "line-opacity": 0.25,
          "line-dasharray": [4, 4],
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
          "line-color": "#4499ff",
          "line-width": 1.2,
          "line-opacity": 0.55,
          "line-dasharray": [4, 3],
        },
        layout: { visibility: "none" },
      });

      // Country borders — crisp purple lines (same GeoJSON source as fill)
      map.addSource("country-borders", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      // Soft glow under the border line
      map.addLayer({
        id: "country-borders-glow",
        type: "line",
        source: "country-borders",
        paint: {
          "line-color": "#dd88ff",
          "line-width": 6,
          "line-opacity": 0.3,
          "line-blur": 4,
        },
        layout: { visibility: "none" },
      });
      // Crisp purple border line
      map.addLayer({
        id: "country-borders-line",
        type: "line",
        source: "country-borders",
        paint: {
          "line-color": "#cc44ff",
          "line-width": 1.8,
          "line-opacity": 0.9,
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

      // Click + hover handlers for dynamic overlay circles
      for (const overlayId of DYNAMIC_OVERLAY_IDS) {
        const layerIdCircle = `${overlayId}-circles`;
        map.on("click", layerIdCircle, (e) => {
          const features = e.features;
          if (!features || features.length === 0) return;
          const props = features[0].properties as {
            name?: string;
            amenity?: string;
            address?: string;
          };
          const title = props.name || "Unknown Place";
          const type = props.amenity ? props.amenity.replace(/_/g, " ") : "";
          const addr = props.address || "";
          const lines = [
            `<div style="font-weight:bold;color:#D4AF37;margin-bottom:4px;">${title}</div>`,
            type
              ? `<div style="color:#aaa;font-size:11px;text-transform:capitalize;">${type}</div>`
              : "",
            addr
              ? `<div style="color:#ccc;font-size:11px;margin-top:3px;">${addr}</div>`
              : "",
          ]
            .filter(Boolean)
            .join("");
          new maplibregl.Popup({ closeButton: true, maxWidth: "220px" })
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="background:#1A1819;color:#E7E7EA;padding:8px 10px;font-family:monospace;font-size:12px;border:1px solid #2F2F34;">${lines}</div>`,
            )
            .addTo(map);
        });
        map.on("mouseenter", layerIdCircle, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerIdCircle, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      // Apply any overlays that were already active before map loaded
      applyOverlays(map, overlaysRef.current, overlayDataRef.current);
      applyStaticOverlays(
        map,
        staticOverlaysRef.current,
        countryBordersLoadedRef,
      );

      onMapReadyRef.current(map);
    });

    return () => {
      // cleanup intentionally omitted — map persists for lifetime of component
    };
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

  // Proximity warning: check airports/restricted zones AND country borders
  useEffect(() => {
    if (!position) return;

    const WARN_RADIUS_MILES = 60;
    const map = mapRef.current;

    const showWarning = (
      zoneName: string,
      distMiles: number,
      textColor: string,
      label: string,
      borderColor: string,
    ) => {
      if (warningPopupRef.current) {
        warningPopupRef.current.remove();
      }
      if (map) {
        const popup = new maplibregl.Popup({
          closeButton: true,
          maxWidth: "280px",
          className: "warning-popup",
        })
          .setLngLat([position.lng, position.lat])
          .setHTML(
            `<div style="background:#0d0a14;color:${textColor};padding:10px 12px;font-family:monospace;font-size:12px;border:1px solid ${borderColor};">
              <div style="font-weight:bold;color:${borderColor};margin-bottom:6px;font-size:13px;">⚠ ${label}</div>
              <div style="color:#e8e0f0;margin-bottom:4px;">You are within 60 miles of:</div>
              <div style="color:#fff;font-weight:bold;">${zoneName}</div>
              <div style="color:#aaa;margin-top:4px;font-size:11px;">Distance: ${distMiles.toFixed(1)} mi</div>
            </div>`,
          )
          .addTo(map);
        warningPopupRef.current = popup;
      }
    };

    // Check airports / restricted zones
    for (const zone of AIRPORT_WARNING_ZONES) {
      const distMiles = haversineDistanceMiles(
        position.lat,
        position.lng,
        zone.lat,
        zone.lng,
      );
      const isInside = distMiles <= WARN_RADIUS_MILES;
      const alreadyWarned = warnedZonesRef.current.has(zone.name);

      if (isInside && !alreadyWarned) {
        warnedZonesRef.current.add(zone.name);
        showWarning(
          zone.name,
          distMiles,
          "#ff8888",
          "RESTRICTED ZONE",
          "#ff4444",
        );
      } else if (!isInside && alreadyWarned) {
        warnedZonesRef.current.delete(zone.name);
      }
    }

    // Check country border proximity — deduplicate by border name prefix
    const firedBorderPrefixes = new Set<string>();
    for (const pt of BORDER_WARNING_POINTS) {
      const distMiles = haversineDistanceMiles(
        position.lat,
        position.lng,
        pt.lat,
        pt.lng,
      );
      const isInside = distMiles <= WARN_RADIUS_MILES;
      const alreadyWarned = warnedZonesRef.current.has(pt.name);

      if (isInside && !alreadyWarned) {
        warnedZonesRef.current.add(pt.name);
        const borderKey = pt.name.replace(/\s*\(.*\)/, "").trim();
        if (!firedBorderPrefixes.has(borderKey)) {
          firedBorderPrefixes.add(borderKey);
          showWarning(
            pt.name,
            distMiles,
            "#cc88ff",
            "BORDER PROXIMITY",
            "#aa44ff",
          );
        }
      } else if (!isInside && alreadyWarned) {
        warnedZonesRef.current.delete(pt.name);
      }
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
    applyStaticOverlays(map, staticOverlays, countryBordersLoadedRef);
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
        .warning-popup .maplibregl-popup-content {
          padding: 0;
          background: transparent;
          border: none;
          box-shadow: 0 0 12px rgba(255,68,68,0.4);
        }
        .warning-popup .maplibregl-popup-tip {
          border-top-color: #ff4444;
        }
      `}</style>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </>
  );
}

function applyStaticOverlays(
  map: MapLibreMap,
  staticOverlays: { id: string; label: string; active: boolean }[],
  countryBordersLoadedRef: React.MutableRefObject<boolean>,
) {
  const layerMap: Record<string, string[]> = {
    "warning-rings": [
      "warning-rings-fill",
      "warning-rings-outline",
      "airport-dots-circle",
      "airport-dots-label",
    ],
    "plane-routes": ["plane-routes-line"],
    "country-borders": [
      "country-borders-country-fill",
      "country-borders-zone-glow",
      "country-borders-zone-dash",
      "country-borders-glow",
      "country-borders-line",
    ],
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

    if (
      overlay.id === "country-borders" &&
      overlay.active &&
      !countryBordersLoadedRef.current
    ) {
      countryBordersLoadedRef.current = true;
      fetch(
        "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson",
      )
        .then((r) => r.json())
        .then((data) => {
          const s = map.getSource(
            "country-borders",
          ) as maplibregl.GeoJSONSource;
          if (s) s.setData(data);
          const sf = map.getSource(
            "country-borders-fill",
          ) as maplibregl.GeoJSONSource;
          if (sf) sf.setData(data);
        })
        .catch(() => {
          countryBordersLoadedRef.current = false;
        });
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
            properties: {
              name: n.tags?.name ?? overlay.label,
              amenity:
                n.tags?.amenity ??
                n.tags?.shop ??
                n.tags?.tourism ??
                n.tags?.leisure ??
                "",
              address: [
                n.tags?.["addr:housenumber"],
                n.tags?.["addr:street"],
                n.tags?.["addr:city"],
              ]
                .filter(Boolean)
                .join(", "),
            },
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
