# Xution Navigation

## Current State
- Overlay places (ATMs, hotels, gas stations, etc.) are fetched live from Overpass API each time a user toggles an overlay on
- No caching of overlay results -- they are lost on page refresh or offline
- Search/address lookup is online only
- No Xution building location feature exists
- `useOverpass.ts` fetches from Overpass API with no persistence
- `App.tsx` stores overlay data only in component state (`overlayData` map)
- `types/index.ts` defines `OverpassNode`, `SavedDestinationLocal`, `Waypoint`
- Saved places/routes are in localStorage under `skyrunner-saved-places`

## Requested Changes (Diff)

### Add
- **Overlay cache with area-based invalidation**: When overlay data is fetched online, store results in localStorage keyed by overlay ID + spatial tile/area hash. On re-open, serve cached data if the user is viewing the same area. Only re-fetch when the user is back online AND panning to a new uncached area.
- **Offline overlay search**: A search panel (or augmented address search) that searches across:
  - Cached overlay places (by name, type, address tags)
  - Saved waypoints and routes (`skyrunner-saved-places`)
  - Results center the map on the matched location
- **Xution Building Locations**: A new category of user-defined locations that work both online and offline. Users can:
  - Add a Xution building location (name, type/category, lat/lng -- either from map click or manual entry)
  - View all Xution buildings as a distinct overlay layer on the map (gold building icon)
  - Buildings persist in localStorage
  - This lays the groundwork for future sync to backend

### Modify
- `useOverpass.ts`: After fetching nodes, write results to localStorage cache with a key that encodes overlay ID + bbox tile. On fetch, check cache first; skip network call if cache is fresh for the area.
- `App.tsx`: On `online` event, re-fetch any currently-active overlays for the current map area (only if the area was not previously cached). Pass Xution buildings state down to `MapView` and `Sidebar`.
- `types/index.ts`: Add `XutionBuilding` type and `CachedOverlayEntry` type.
- `Sidebar`: Add a search section and a Xution Buildings section with add form and list.
- `OverlayControls`: Add a Xution Buildings toggle button.
- `Map.tsx`: Render Xution building markers as a distinct gold layer.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `XutionBuilding` and `CachedOverlayEntry` types to `types/index.ts`
2. Create `src/utils/overlayCache.ts` -- helper functions: `getCachedOverlay(id, bbox)`, `setCachedOverlay(id, bbox, nodes)`, tile-key logic for area matching
3. Update `useOverpass.ts` to check cache before fetching; write to cache after fetch
4. Update `App.tsx`:
   - On `online` event, re-fetch active overlays for current map bbox (skip if area already cached)
   - Add `xutionBuildings` state (loaded from localStorage)
   - Pass buildings to Sidebar and MapView
5. Create `src/utils/xutionBuildings.ts` -- CRUD helpers for localStorage persistence of buildings
6. Add `XutionBuildings` panel to `Sidebar` with add form (name, type) and list
7. Update `OverlayControls` to include Xution Buildings toggle
8. Update `Map.tsx` to render Xution building markers with gold distinct style
9. Create `src/components/OfflineSearch.tsx` -- searches cached overlay places + saved places/waypoints; shows results list with fly-to
10. Wire `OfflineSearch` into Sidebar as a new collapsible section
