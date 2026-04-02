import { Download, MapPin, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { SavedDestinationLocal, Waypoint } from "../types";

interface SavedPlacesProps {
  waypoints: Waypoint[];
  onLoadDestination: (dest: SavedDestinationLocal) => void;
  onFlyTo: (lat: number, lng: number) => void;
}

export function SavedPlaces({
  waypoints,
  onLoadDestination,
  onFlyTo,
}: SavedPlacesProps) {
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const loadSaved = (): SavedDestinationLocal[] => {
    try {
      return JSON.parse(localStorage.getItem("skyrunner-saved-places") || "[]");
    } catch {
      return [];
    }
  };

  const [saved, setSaved] = useState<SavedDestinationLocal[]>(loadSaved);

  const saveCurrentRoute = () => {
    if (!saveName.trim() || waypoints.length === 0) return;
    const dest: SavedDestinationLocal = {
      id: Date.now().toString(),
      name: saveName.trim(),
      lat: waypoints[0].lat,
      lng: waypoints[0].lng,
      notes: "",
      waypoints: [...waypoints],
      createdAt: Date.now(),
    };
    const updated = [...saved, dest];
    setSaved(updated);
    localStorage.setItem("skyrunner-saved-places", JSON.stringify(updated));
    setSaveName("");
    setShowSaveInput(false);
  };

  const deletePlace = (id: string) => {
    const updated = saved.filter((s) => s.id !== id);
    setSaved(updated);
    localStorage.setItem("skyrunner-saved-places", JSON.stringify(updated));
  };

  return (
    <div className="space-y-2">
      {saved.length === 0 && (
        <p
          className="text-xs text-[#A7A7AD] py-2"
          data-ocid="saved.empty_state"
        >
          No saved destinations yet.
        </p>
      )}
      {saved.map((dest, index) => (
        <div
          key={dest.id}
          className="flex items-center gap-2 p-2 bg-[#0e0e0f] border border-[#2F2F34] group"
          data-ocid={`saved.item.${index + 1}`}
        >
          <MapPin size={12} className="text-[#D4AF37] flex-shrink-0" />
          <span className="text-xs text-[#E7E7EA] flex-1 truncate">
            {dest.name}
          </span>
          <button
            type="button"
            onClick={() => {
              onFlyTo(dest.lat, dest.lng);
              onLoadDestination(dest);
            }}
            className="text-[#A7A7AD] hover:text-[#D4AF37] transition-colors p-0.5"
            title="Load destination"
            data-ocid={`saved.load.button.${index + 1}`}
          >
            <Download size={11} />
          </button>
          <button
            type="button"
            onClick={() => deletePlace(dest.id)}
            className="text-[#A7A7AD] hover:text-red-400 transition-colors p-0.5"
            title="Delete"
            data-ocid={`saved.delete_button.${index + 1}`}
          >
            <Trash2 size={11} />
          </button>
        </div>
      ))}

      {showSaveInput ? (
        <div className="flex gap-1">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveCurrentRoute()}
            placeholder="Destination name..."
            className="flex-1 bg-[#0e0e0f] border border-[#2F2F34] text-[#E7E7EA] text-xs px-2 py-1.5 font-mono placeholder-[#A7A7AD] focus:outline-none focus:border-[#D4AF37]"
            data-ocid="saved.input"
          />
          <button
            type="button"
            onClick={saveCurrentRoute}
            disabled={!saveName.trim() || waypoints.length === 0}
            className="px-2 py-1.5 bg-[#D4AF37] text-[#020202] text-xs font-bold hover:bg-[#c49f2f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-ocid="saved.submit_button"
          >
            <Save size={12} />
          </button>
          <button
            type="button"
            onClick={() => setShowSaveInput(false)}
            className="px-2 py-1.5 border border-[#2F2F34] text-[#A7A7AD] text-xs hover:text-[#E7E7EA] transition-colors"
            data-ocid="saved.cancel_button"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSaveInput(true)}
          disabled={waypoints.length === 0}
          className="w-full py-1.5 border border-[#D4AF37] text-[#D4AF37] text-xs font-bold tracking-wider hover:bg-[#D4AF37]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          data-ocid="saved.primary_button"
        >
          + SAVE CURRENT ROUTE
        </button>
      )}
    </div>
  );
}
