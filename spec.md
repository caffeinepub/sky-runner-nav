# Xution Navigation

## Current State
The app has a "TRACK LOCATION" button in the bottom-right corner of the map. When active, it turns gold with a pulsing icon and follows the user's GPS position. The position is shown in the header (coordinates) but not on the map itself during tracking.

## Requested Changes (Diff)

### Add
- When tracking is active AND a GPS position is available, show a small coordinate display on the map (overlaid near the TRACK LOCATION button or above it) showing the current latitude/longitude.

### Modify
- Map overlay area: add a coordinate badge that appears only when `trackingUser === true && position !== null`.

### Remove
- Nothing removed.

## Implementation Plan
1. In `App.tsx`, add a coordinate display element inside the map's `<div className="flex-1 relative">` container.
2. It should appear above the TRACK LOCATION button, only when `trackingUser && position` are both truthy.
3. Style: gold text on dark background, consistent with the gold-on-black theme, small/compact.
4. Show lat/lng to 5 decimal places with accuracy if available.
