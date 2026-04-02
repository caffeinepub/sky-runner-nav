import type { TravelMode } from "../types";

interface ModeSelectorProps {
  mode: TravelMode;
  onChange: (mode: TravelMode) => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  const modes: { id: TravelMode; label: string }[] = [
    { id: "driving", label: "DRIVING" },
    { id: "flying", label: "FLYING" },
    { id: "teleport", label: "TELEPORT" },
  ];

  return (
    <div className="flex items-center gap-1">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          data-ocid={`mode.${m.id}.tab`}
          className={`px-4 py-1.5 text-xs font-mono font-bold tracking-widest transition-all ${
            mode === m.id
              ? "border border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10"
              : "border border-[#2F2F34] text-[#A7A7AD] hover:border-[#D4AF37]/50 hover:text-[#D4AF37]/70"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
