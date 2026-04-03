import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { GeoPosition } from "../hooks/useGeolocation";
import type {
  FlyingRestStop,
  OverlayType,
  OverpassNode,
  Waypoint,
  XutionBuilding,
} from "../types";

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
  // Europe
  { name: "Amsterdam Schiphol", lat: 52.3086, lng: 4.7639 },
  { name: "Madrid Barajas", lat: 40.4983, lng: -3.5676 },
  { name: "Rome Fiumicino", lat: 41.8003, lng: 12.2389 },
  { name: "Barcelona El Prat", lat: 41.2974, lng: 2.0833 },
  { name: "Munich Intl", lat: 48.3538, lng: 11.7861 },
  { name: "Zurich Intl", lat: 47.4647, lng: 8.5492 },
  { name: "Vienna Intl", lat: 48.1103, lng: 16.5697 },
  { name: "Brussels Zaventem", lat: 50.901, lng: 4.4844 },
  { name: "Copenhagen Kastrup", lat: 55.618, lng: 12.6561 },
  { name: "Stockholm Arlanda", lat: 59.6519, lng: 17.9186 },
  { name: "Oslo Gardermoen", lat: 60.1939, lng: 11.1004 },
  { name: "Helsinki Vantaa", lat: 60.3172, lng: 24.9633 },
  { name: "Warsaw Chopin", lat: 52.1657, lng: 20.9671 },
  { name: "Prague Vaclav Havel", lat: 50.1008, lng: 14.26 },
  { name: "Budapest Ferenc Liszt", lat: 47.4369, lng: 19.2556 },
  { name: "Lisbon Humberto Delgado", lat: 38.7813, lng: -9.1359 },
  { name: "Dublin Intl", lat: 53.4213, lng: -6.27 },
  { name: "Athens Eleftherios Venizelos", lat: 37.9364, lng: 23.9445 },
  { name: "Istanbul Ataturk", lat: 40.9769, lng: 28.8146 },
  { name: "Istanbul Airport (New)", lat: 41.2753, lng: 28.7519 },
  { name: "Moscow Sheremetyevo", lat: 55.9726, lng: 37.4146 },
  { name: "Moscow Domodedovo", lat: 55.4088, lng: 37.9063 },
  { name: "St Petersburg Pulkovo", lat: 59.8003, lng: 30.2625 },
  { name: "Kiev Boryspil", lat: 50.345, lng: 30.8947 },
  { name: "Minsk Natl", lat: 53.8825, lng: 28.0322 },
  { name: "Bucharest Henri Coanda", lat: 44.5711, lng: 26.085 },
  { name: "Sofia Intl", lat: 42.6952, lng: 23.4114 },
  { name: "Belgrade Nikola Tesla", lat: 44.8184, lng: 20.3091 },
  { name: "Zagreb Intl", lat: 45.7429, lng: 16.0688 },
  { name: "Ramstein Air Base (US Military)", lat: 49.4369, lng: 7.6003 },
  { name: "NATO HQ / Restricted (Brussels)", lat: 50.8793, lng: 4.4183 },
  { name: "London City Airport", lat: 51.5033, lng: 0.0552 },
  { name: "Edinburgh Airport", lat: 55.9508, lng: -3.3725 },
  { name: "Manchester Airport", lat: 53.3537, lng: -2.275 },
  { name: "Paris Orly", lat: 48.7233, lng: 2.3794 },
  { name: "Lyon Saint-Exupery", lat: 45.7256, lng: 5.0811 },
  { name: "Nice Cote d'Azur", lat: 43.6584, lng: 7.2159 },
  { name: "Dusseldorf Intl", lat: 51.2895, lng: 6.7668 },
  { name: "Hamburg Airport", lat: 53.6304, lng: 9.9882 },
  { name: "Stuttgart Airport", lat: 48.69, lng: 9.222 },
  { name: "Palma de Mallorca", lat: 39.5517, lng: 2.7388 },
  // Asia-Pacific
  { name: "Tokyo Narita (NRT)", lat: 35.772, lng: 140.3929 },
  { name: "Tokyo Haneda (HND)", lat: 35.5494, lng: 139.7803 },
  { name: "Seoul Incheon", lat: 37.4691, lng: 126.451 },
  { name: "Beijing Capital", lat: 40.0801, lng: 116.5977 },
  { name: "Beijing Daxing", lat: 39.5098, lng: 116.4105 },
  { name: "Shanghai Pudong", lat: 31.1443, lng: 121.8083 },
  { name: "Shanghai Hongqiao", lat: 31.1979, lng: 121.3363 },
  { name: "Hong Kong Intl", lat: 22.308, lng: 113.9185 },
  { name: "Singapore Changi", lat: 1.3644, lng: 103.9915 },
  { name: "Kuala Lumpur Intl", lat: 2.7456, lng: 101.7072 },
  { name: "Bangkok Suvarnabhumi", lat: 13.69, lng: 100.7501 },
  { name: "Manila Ninoy Aquino", lat: 14.5086, lng: 121.0197 },
  { name: "Jakarta Soekarno-Hatta", lat: -6.1256, lng: 106.6559 },
  { name: "Sydney Kingsford Smith", lat: -33.9399, lng: 151.1772 },
  { name: "Melbourne Tullamarine", lat: -37.669, lng: 144.841 },
  { name: "Brisbane Intl", lat: -27.3842, lng: 153.1175 },
  { name: "Perth Intl", lat: -31.9403, lng: 115.9672 },
  { name: "Auckland Intl", lat: -37.0082, lng: 174.785 },
  { name: "Mumbai Chhatrapati Shivaji", lat: 19.0896, lng: 72.8656 },
  { name: "Delhi Indira Gandhi", lat: 28.5562, lng: 77.1 },
  { name: "Kolkata Netaji Subhas", lat: 22.652, lng: 88.4463 },
  { name: "Chennai Intl", lat: 12.99, lng: 80.1693 },
  { name: "Bengaluru Kempegowda", lat: 13.1979, lng: 77.7063 },
  { name: "Hyderabad Rajiv Gandhi", lat: 17.2403, lng: 78.4294 },
  { name: "Karachi Jinnah Intl", lat: 24.9065, lng: 67.1608 },
  { name: "Lahore Allama Iqbal", lat: 31.5216, lng: 74.4036 },
  { name: "Islamabad New Intl", lat: 33.5487, lng: 72.8364 },
  { name: "Dhaka Hazrat Shahjalal", lat: 23.8433, lng: 90.3978 },
  { name: "Colombo Bandaranaike", lat: 7.1808, lng: 79.8841 },
  { name: "Kathmandu Tribhuvan", lat: 27.6966, lng: 85.3591 },
  { name: "Rangoon Mingaladon", lat: 16.9023, lng: 96.1332 },
  { name: "Phnom Penh Pochentong", lat: 11.5466, lng: 104.844 },
  { name: "Ho Chi Minh City Tan Son Nhat", lat: 10.8188, lng: 106.652 },
  { name: "Hanoi Noi Bai", lat: 21.2212, lng: 105.8072 },
  { name: "Taipei Taoyuan", lat: 25.0777, lng: 121.233 },
  { name: "Osaka Kansai", lat: 34.4273, lng: 135.244 },
  { name: "Nagoya Chubu Centrair", lat: 34.8583, lng: 136.805 },
  { name: "Fukuoka Airport", lat: 33.5858, lng: 130.4511 },
  { name: "Kadena Air Base (US Military)", lat: 26.3558, lng: 127.7681 },
  { name: "Camp Humphreys (US Military)", lat: 36.9719, lng: 126.9869 },
  { name: "Andersen AFB Guam (US Military)", lat: 13.5836, lng: 144.9296 },
  { name: "Diego Garcia (US Military Base)", lat: -7.3133, lng: 72.4108 },
  { name: "North Korea Restricted Airspace", lat: 39.0, lng: 125.75 },
  { name: "Kabul Hamid Karzai", lat: 34.5658, lng: 69.2123 },
  { name: "Bagram Air Base (US Military)", lat: 34.9461, lng: 69.2647 },
  // Middle East
  { name: "Dubai Intl (DXB)", lat: 25.2532, lng: 55.3644 },
  { name: "Dubai Al Maktoum (DWC)", lat: 24.8963, lng: 55.1613 },
  { name: "Abu Dhabi Intl", lat: 24.433, lng: 54.6511 },
  { name: "Doha Hamad Intl", lat: 25.2731, lng: 51.6081 },
  { name: "Kuwait Intl", lat: 29.2267, lng: 47.9689 },
  { name: "Bahrain Intl", lat: 26.2708, lng: 50.6336 },
  { name: "Muscat Intl", lat: 23.5933, lng: 58.2844 },
  { name: "Riyadh King Khalid", lat: 24.9578, lng: 46.6988 },
  { name: "Jeddah King Abdulaziz", lat: 21.6796, lng: 39.1565 },
  { name: "Tel Aviv Ben Gurion", lat: 31.9965, lng: 34.8854 },
  { name: "Amman Queen Alia", lat: 31.7226, lng: 35.9932 },
  { name: "Beirut Rafic Hariri", lat: 33.8208, lng: 35.4883 },
  { name: "Baghdad Intl", lat: 33.2625, lng: 44.2346 },
  { name: "Tehran Imam Khomeini", lat: 35.4161, lng: 51.1522 },
  { name: "Ankara Esenboga", lat: 40.1281, lng: 32.9951 },
  { name: "Mecca Restricted Zone (No-Go)", lat: 21.4225, lng: 39.8262 },
  // Africa
  { name: "Cairo Intl", lat: 30.1219, lng: 31.4056 },
  { name: "Johannesburg OR Tambo", lat: -26.1367, lng: 28.2411 },
  { name: "Cape Town Intl", lat: -33.9649, lng: 18.6017 },
  { name: "Lagos Murtala Muhammed", lat: 6.5774, lng: 3.3214 },
  { name: "Nairobi Jomo Kenyatta", lat: -1.3192, lng: 36.9275 },
  { name: "Addis Ababa Bole", lat: 8.9779, lng: 38.7993 },
  { name: "Casablanca Mohammed V", lat: 33.3675, lng: -7.5897 },
  { name: "Tunis Carthage", lat: 36.851, lng: 10.2272 },
  { name: "Algiers Houari Boumediene", lat: 36.691, lng: 3.2154 },
  { name: "Tripoli Mitiga", lat: 32.8941, lng: 13.276 },
  { name: "Dar es Salaam Julius Nyerere", lat: -6.8781, lng: 39.2026 },
  { name: "Accra Kotoka", lat: 5.6052, lng: -0.1668 },
  { name: "Abidjan Felix Houphouet-Boigny", lat: 5.2613, lng: -3.9263 },
  { name: "Dakar Leopold Sedar Senghor", lat: 14.7397, lng: -17.4902 },
  { name: "Khartoum Intl", lat: 15.5895, lng: 32.5532 },
  { name: "Camp Lemonnier (US Military)", lat: 11.5467, lng: 43.1597 },
  { name: "Luanda Quatro de Fevereiro", lat: -8.8583, lng: 13.2312 },
  { name: "Maputo Intl", lat: -25.9208, lng: 32.5726 },
  { name: "Harare Intl", lat: -17.9318, lng: 31.0928 },
  { name: "Entebbe Intl", lat: 0.0424, lng: 32.4435 },
  { name: "Lusaka Kenneth Kaunda", lat: -15.3308, lng: 28.4526 },
  // South America
  { name: "Sao Paulo Guarulhos", lat: -23.4356, lng: -46.4731 },
  { name: "Rio de Janeiro Galeao", lat: -22.8099, lng: -43.2505 },
  { name: "Buenos Aires Ezeiza", lat: -34.8222, lng: -58.5358 },
  { name: "Bogota El Dorado", lat: 4.7016, lng: -74.1469 },
  { name: "Lima Jorge Chavez", lat: -12.0219, lng: -77.1143 },
  { name: "Santiago Arturo Merino Benitez", lat: -33.393, lng: -70.7858 },
  { name: "Caracas Simon Bolivar", lat: 10.6031, lng: -66.9914 },
  { name: "Quito Mariscal Sucre", lat: -0.1292, lng: -78.3575 },
  { name: "Guayaquil Jose Joaquin", lat: -2.1574, lng: -79.8836 },
  { name: "Medellin Jose Marie Cordova", lat: 6.1655, lng: -75.4231 },
  { name: "Asuncion Silvio Pettirossi", lat: -25.24, lng: -57.52 },
  { name: "Montevideo Carrasco", lat: -34.8384, lng: -56.0308 },
  { name: "La Paz El Alto", lat: -16.5133, lng: -68.1923 },
  { name: "Brasilia Intl", lat: -15.8711, lng: -47.9186 },
  { name: "Recife Guararapes", lat: -8.1265, lng: -34.9228 },
  { name: "Porto Alegre Salgado Filho", lat: -29.9944, lng: -51.1714 },
  { name: "Manaus Eduardo Gomes", lat: -3.0386, lng: -60.0497 },
  // Central America & Caribbean
  { name: "Mexico City Felipe Angeles", lat: 19.7459, lng: -99.0151 },
  { name: "Monterrey Mariano Escobedo", lat: 25.7785, lng: -100.1069 },
  { name: "Guadalajara Miguel Hidalgo", lat: 20.5218, lng: -103.3111 },
  { name: "Guatemala City La Aurora", lat: 14.5833, lng: -90.5275 },
  { name: "San Jose Juan Santamaria", lat: 9.9939, lng: -84.2088 },
  { name: "Panama City Tocumen", lat: 9.0714, lng: -79.3835 },
  { name: "Santo Domingo Las Americas", lat: 18.4297, lng: -69.6689 },
  { name: "San Juan Luis Munoz Marin", lat: 18.4394, lng: -66.0018 },
  { name: "Havana Jose Marti Intl", lat: 22.9892, lng: -82.4091 },
  { name: "Guantanamo Bay (US Military)", lat: 19.9069, lng: -75.0988 },
  { name: "Nassau Intl", lat: 25.0389, lng: -77.4662 },
  { name: "Kingston Norman Manley", lat: 17.9357, lng: -76.7875 },
  { name: "Port-au-Prince Toussaint", lat: 18.5799, lng: -72.2925 },
  { name: "Cancun Intl", lat: 21.0365, lng: -86.8771 },
  { name: "Punta Cana Intl", lat: 18.5674, lng: -68.3634 },
  { name: "Montego Bay Sangster", lat: 18.5037, lng: -77.9135 },
  { name: "Trinidad Port of Spain", lat: 10.5954, lng: -61.3372 },
  { name: "Bridgetown Grantley Adams", lat: 13.0746, lng: -59.4925 },
  { name: "Belize City Philip Goldson", lat: 17.5391, lng: -88.3082 },
  { name: "Tegucigalpa Toncontin", lat: 14.0608, lng: -87.2172 },
  { name: "Managua Augusto Sandino", lat: 12.1415, lng: -86.1682 },
  { name: "San Salvador Monsenor Oscar Romero", lat: 13.4409, lng: -89.0557 },
  // Restricted / Government Zones Worldwide
  { name: "Vatican Restricted Airspace", lat: 41.9029, lng: 12.4534 },
  { name: "Kremlin / Moscow Restricted Zone", lat: 55.752, lng: 37.6175 },
  {
    name: "Zhongnanhai Restricted Zone (Beijing)",
    lat: 39.9219,
    lng: 116.3813,
  },
  { name: "Pyongyang Restricted Zone (DPRK)", lat: 39.0194, lng: 125.7381 },
  { name: "Riyadh Royal Restricted Zone", lat: 24.6877, lng: 46.7219 },
  { name: "London Restricted Airspace (Royal)", lat: 51.5014, lng: -0.1419 },
  { name: "Paris Restricted Airspace (Government)", lat: 48.8728, lng: 2.3162 },
  { name: "US Naval Base Bahrain", lat: 26.234, lng: 50.5934 },
  { name: "Pearl Harbor-Hickam (US Military)", lat: 21.3281, lng: -157.9396 },
  { name: "Cheyenne Mountain NORAD Complex", lat: 38.7448, lng: -104.846 },
  { name: "Wright-Patterson AFB", lat: 39.8261, lng: -84.0484 },
  { name: "MacDill AFB (CENTCOM)", lat: 27.8492, lng: -82.5213 },
  { name: "Edwards Air Force Base", lat: 34.9054, lng: -117.8839 },
  { name: "Vandenberg Space Force Base", lat: 34.742, lng: -120.5724 },
  { name: "Cape Canaveral Space Force Station", lat: 28.4889, lng: -80.5778 },
  { name: "Nellis Air Force Base", lat: 36.2354, lng: -115.0341 },
  { name: "Fairchild Air Force Base", lat: 47.6151, lng: -117.6557 },
  { name: "Barksdale Air Force Base", lat: 32.5018, lng: -93.6627 },
  { name: "Tinker Air Force Base", lat: 35.4147, lng: -97.3866 },
  { name: "Minot Air Force Base (Nuclear)", lat: 48.4156, lng: -101.358 },
  { name: "Malmstrom AFB (Nuclear)", lat: 47.5081, lng: -111.1878 },
  { name: "F.E. Warren AFB (Nuclear)", lat: 41.1453, lng: -104.8527 },
  { name: "Russian Northern Fleet HQ", lat: 69.0686, lng: 33.4169 },
  { name: "Sevastopol Naval Base (Russia)", lat: 44.6166, lng: 33.5254 },
  { name: "PLA Navy Yulin Base (China)", lat: 18.2552, lng: 109.7214 },
  { name: "RAF Lakenheath (US Air Force UK)", lat: 52.4094, lng: 0.5606 },
  { name: "RAF Mildenhall (US Air Force UK)", lat: 52.3619, lng: 0.4864 },
  { name: "Incirlik Air Base (US/NATO)", lat: 37.0021, lng: 35.4259 },
  { name: "Al Udeid Air Base (US Military)", lat: 25.1173, lng: 51.315 },
  { name: "Ali Al Salem Air Base (US)", lat: 29.3467, lng: 47.52 },
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
  onMapClick?: (
    lat: number,
    lng: number,
    action: "destination" | "waypoint",
  ) => void;
  mode: string;
  flyingRestStops?: FlyingRestStop[];
  xutionBuildings?: XutionBuilding[];
  showXutionBuildings?: boolean;
}

export function MapView({
  position,
  waypoints,
  overlays,
  overlayData,
  staticOverlays,
  onMapReady,
  onMapClick,
  flyingRestStops = [],
  xutionBuildings = [],
  showXutionBuildings = false,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const waypointMarkersRef = useRef<Marker[]>([]);
  const onMapReadyRef = useRef(onMapReady);
  const onMapClickRef = useRef(onMapClick);
  const mapLoadedRef = useRef(false);
  const overlaysRef = useRef(overlays);
  const overlayDataRef = useRef(overlayData);
  const staticOverlaysRef = useRef(staticOverlays);
  const warnedZonesRef = useRef<Set<string>>(new Set());
  const warningPopupRef = useRef<maplibregl.Popup | null>(null);
  const restStopPopupRef = useRef<maplibregl.Popup | null>(null);
  const countryBordersLoadedRef = useRef(false);
  const xutionBuildingMarkersRef = useRef<maplibregl.Marker[]>([]);

  onMapReadyRef.current = onMapReady;
  onMapClickRef.current = onMapClick;
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

      // Map click: show context popup to set destination or add waypoint
      const clickPopupRef: { current: maplibregl.Popup | null } = {
        current: null,
      };
      map.on("click", (e) => {
        // Don't fire if a feature layer was clicked
        const features = map.queryRenderedFeatures(e.point);
        const isFeatureClick = features.some((f) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const layerId: string | undefined = (f as any)?.layer?.id;
          return (
            layerId !== undefined &&
            (layerId.includes("-circles") ||
              layerId.includes("warning") ||
              layerId.includes("plane") ||
              layerId.includes("border"))
          );
        });
        if (isFeatureClick) return;

        const { lng, lat } = e.lngLat;

        if (clickPopupRef.current) {
          clickPopupRef.current.remove();
          clickPopupRef.current = null;
        }

        const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        const popupHtml = `
          <div style="background:#0e0e0f;color:#E7E7EA;padding:10px 12px;font-family:monospace;font-size:12px;border:1px solid #D4AF37;min-width:190px;">
            <div style="color:#D4AF37;font-weight:bold;margin-bottom:8px;font-size:11px;letter-spacing:0.1em;">📍 ${coordStr}</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <button id="btn-set-dest"
                style="background:#D4AF37;color:#020202;border:none;padding:5px 10px;font-family:monospace;font-size:11px;font-weight:bold;cursor:pointer;letter-spacing:0.05em;text-align:left;"
                onmouseover="this.style.background='#f0c842'"
                onmouseout="this.style.background='#D4AF37'">
                ⬛ SET AS DESTINATION
              </button>
              <button id="btn-add-waypoint"
                style="background:#1A1819;color:#D4AF37;border:1px solid #D4AF37;padding:5px 10px;font-family:monospace;font-size:11px;font-weight:bold;cursor:pointer;letter-spacing:0.05em;text-align:left;"
                onmouseover="this.style.background='#2a2828'"
                onmouseout="this.style.background='#1A1819'">
                ＋ ADD AS WAYPOINT
              </button>
            </div>
          </div>`;

        const popup = new maplibregl.Popup({
          closeButton: true,
          maxWidth: "240px",
          className: "map-click-popup",
        })
          .setLngLat([lng, lat])
          .setHTML(popupHtml)
          .addTo(map);

        clickPopupRef.current = popup as unknown as maplibregl.Popup;

        // Bind button handlers after popup is added to DOM
        setTimeout(() => {
          const btnDest = document.getElementById("btn-set-dest");
          const btnWp = document.getElementById("btn-add-waypoint");
          if (btnDest) {
            btnDest.onclick = () => {
              if (onMapClickRef.current)
                onMapClickRef.current(lat, lng, "destination");
              popup.remove();
              clickPopupRef.current = null;
            };
          }
          if (btnWp) {
            btnWp.onclick = () => {
              if (onMapClickRef.current)
                onMapClickRef.current(lat, lng, "waypoint");
              popup.remove();
              clickPopupRef.current = null;
            };
          }
        }, 50);
      });

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
        warningPopupRef.current = popup as unknown as maplibregl.Popup;
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

  // Update flying rest stop markers on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const SOURCE_ID = "flying-rest-stops";
    const LAYER_ID = "rest-stop-markers";

    const featureCollection = {
      type: "FeatureCollection" as const,
      features: flyingRestStops.map((stop) => ({
        type: "Feature" as const,
        properties: {
          id: stop.id,
          name: stop.name,
          isForest: stop.isForest,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [stop.lng, stop.lat],
        },
      })),
    };

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "geojson", data: featureCollection });
      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-color": "#2d7a2d",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#D4AF37",
        },
      });

      // Hover popup
      map.on("click", LAYER_ID, (e) => {
        const features = e.features;
        if (!features || features.length === 0) return;
        const props = features[0].properties as {
          name: string;
          isForest: boolean;
        };
        const coords = (features[0].geometry as GeoJSON.Point).coordinates as [
          number,
          number,
        ];

        if (restStopPopupRef.current) restStopPopupRef.current.remove();
        restStopPopupRef.current = new maplibregl.Popup({
          closeButton: true,
          maxWidth: "240px",
        })
          .setLngLat(coords)
          .setHTML(
            `<div style="background:#0e0e0f;color:#E7E7EA;padding:10px 12px;font-family:monospace;font-size:12px;border:1px solid #2d7a2d;">
              <div style="font-weight:bold;color:#D4AF37;margin-bottom:4px;font-size:11px;letter-spacing:0.1em;">🌲 REST STOP</div>
              <div style="color:#E7E7EA;">${props.name}</div>
              <div style="color:#A7A7AD;font-size:10px;margin-top:4px;">${props.isForest ? "Forest" : "Park / Green Area"}</div>
            </div>`,
          )
          .addTo(map) as unknown as maplibregl.Popup;
      });

      map.on("mouseenter", LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    } else {
      (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource).setData(
        featureCollection,
      );
    }
  }, [flyingRestStops]);

  // Update Xution Building markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    // Remove existing xution markers
    for (const m of xutionBuildingMarkersRef.current) m.remove();
    xutionBuildingMarkersRef.current = [];

    if (!showXutionBuildings) return;

    for (const building of xutionBuildings) {
      const el = document.createElement("div");
      el.style.cssText = [
        "width: 22px",
        "height: 22px",
        "background: #1A1819",
        "border: 2px solid #D4AF37",
        "border-radius: 2px",
        "display: flex",
        "align-items: center",
        "justify-content: center",
        "font-size: 13px",
        "cursor: pointer",
        "box-shadow: 0 0 8px rgba(212,175,55,0.5)",
      ].join("; ");
      el.textContent = "\u{1F3DB}";

      const notesHtml = building.notes
        ? `<div style="color:#E7E7EA;margin-bottom:4px;font-size:11px;">${building.notes}</div>`
        : "";

      const popup = new maplibregl.Popup({
        closeButton: true,
        offset: 12,
        maxWidth: "220px",
      }).setHTML(
        `<div style="background:#0e0e0f;color:#E7E7EA;padding:10px 12px;font-family:monospace;font-size:12px;border:1px solid #D4AF37;min-width:180px;">
            <div style="color:#D4AF37;font-weight:bold;margin-bottom:4px;font-size:11px;letter-spacing:0.1em;">\u{1F3DB} ${building.name}</div>
            <div style="color:#A7A7AD;font-size:10px;margin-bottom:4px;">${building.category}</div>
            ${notesHtml}
            <div style="color:#A7A7AD;font-size:10px;font-family:monospace;">${building.lat.toFixed(5)}, ${building.lng.toFixed(5)}</div>
          </div>`,
      );

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([building.lng, building.lat])
        .setPopup(popup)
        .addTo(map);

      xutionBuildingMarkersRef.current.push(marker);
    }
  }, [xutionBuildings, showXutionBuildings]);

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
