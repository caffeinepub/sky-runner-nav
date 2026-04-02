import type { OverlayType } from "../types";

interface OverlayControlsProps {
  overlays: OverlayType[];
  onToggle: (id: string) => void;
  staticOverlays: { id: string; label: string; active: boolean }[];
  onToggleStatic: (id: string) => void;
}

export function OverlayControls({
  overlays,
  onToggle,
  staticOverlays,
  onToggleStatic,
}: OverlayControlsProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {overlays.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            data-ocid={`overlay.${o.id}.toggle`}
            className={`px-2 py-1 text-[10px] font-mono tracking-wide transition-all ${
              o.active
                ? "border border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10"
                : "border border-[#2F2F34] text-[#A7A7AD] hover:border-[#2F2F34]/80"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="border-t border-[#2F2F34] pt-2">
        <p className="text-[10px] text-[#A7A7AD] mb-1.5 tracking-wider">
          STATIC LAYERS
        </p>
        <div className="flex flex-wrap gap-1.5">
          {staticOverlays.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggleStatic(o.id)}
              data-ocid={`static.${o.id}.toggle`}
              className={`px-2 py-1 text-[10px] font-mono tracking-wide transition-all ${
                o.active
                  ? "border border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10"
                  : "border border-[#2F2F34] text-[#A7A7AD] hover:border-[#2F2F34]/80"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
