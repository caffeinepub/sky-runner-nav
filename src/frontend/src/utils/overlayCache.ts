import type { OverpassNode } from "../types";

const CACHE_PREFIX = "overlay_cache_";
const TILE_SIZE = 0.5; // 0.5 degree grid tiles

export interface CachedOverlayEntry {
  nodes: OverpassNode[];
  fetchedAt: number;
  tileKey: string;
}

/**
 * Snaps a bbox center to the nearest 0.5-degree grid tile and returns a string key.
 */
export function getTileKey(bbox: [number, number, number, number]): string {
  const centerLat = (bbox[0] + bbox[2]) / 2;
  const centerLng = (bbox[1] + bbox[3]) / 2;
  const tileLat = Math.floor(centerLat / TILE_SIZE) * TILE_SIZE;
  const tileLng = Math.floor(centerLng / TILE_SIZE) * TILE_SIZE;
  return `${tileLat.toFixed(1)}_${tileLng.toFixed(1)}`;
}

/**
 * Checks if any cached tile covers this bbox center.
 * Returns nodes if found, null otherwise.
 */
export function getCachedOverlay(
  overlayId: string,
  bbox: [number, number, number, number],
): OverpassNode[] | null {
  const tileKey = getTileKey(bbox);
  const storageKey = `${CACHE_PREFIX}${overlayId}_${tileKey}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const entry: CachedOverlayEntry = JSON.parse(raw);
    return entry.nodes;
  } catch {
    return null;
  }
}

/**
 * Stores overlay nodes under the tile key for this bbox.
 */
export function setCachedOverlay(
  overlayId: string,
  bbox: [number, number, number, number],
  nodes: OverpassNode[],
): void {
  const tileKey = getTileKey(bbox);
  const storageKey = `${CACHE_PREFIX}${overlayId}_${tileKey}`;
  const entry: CachedOverlayEntry = {
    nodes,
    fetchedAt: Date.now(),
    tileKey,
  };
  try {
    localStorage.setItem(storageKey, JSON.stringify(entry));
  } catch {
    // localStorage might be full — silently ignore
  }
}

/**
 * Clears all overlay cache entries (keys starting with overlay_cache_).
 */
export function clearOverlayCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}

/**
 * Returns all cached overlay nodes from all overlay types.
 * Used for offline search.
 */
export function getAllCachedOverlayNodes(): Array<{
  node: OverpassNode;
  overlayId: string;
}> {
  const results: Array<{ node: OverpassNode; overlayId: string }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(CACHE_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const entry: CachedOverlayEntry = JSON.parse(raw);
      // Extract overlayId from key: overlay_cache_<overlayId>_<tileKey>
      const withoutPrefix = key.slice(CACHE_PREFIX.length);
      // tileKey format is "XX.X_YY.Y" — find last occurrence of pattern
      const tileMatch = withoutPrefix.match(/^(.+)_(-?\d+\.\d+_-?\d+\.\d+)$/);
      const overlayId = tileMatch ? tileMatch[1] : withoutPrefix;
      for (const node of entry.nodes) {
        results.push({ node, overlayId });
      }
    } catch {
      // skip malformed entries
    }
  }
  return results;
}
