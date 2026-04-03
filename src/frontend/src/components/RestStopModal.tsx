import { Plane, TreePine, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface RestStopModalProps {
  open: boolean;
  onSelect: (hours: number) => void;
  onSkip: () => void;
  onClose: () => void;
}

const OPTIONS = [
  { hours: 0.25, label: "Every 15 Min" },
  { hours: 0.5, label: "Every 30 Min" },
  { hours: 0.75, label: "Every 45 Min" },
  { hours: 1, label: "Every 1 Hour" },
  { hours: 2, label: "Every 2 Hours" },
  { hours: 3, label: "Every 3 Hours" },
  { hours: 4, label: "Every 4 Hours" },
  { hours: 6, label: "Every 6 Hours" },
  { hours: 8, label: "Every 8 Hours" },
  { hours: 10, label: "Every 10 Hours" },
  { hours: 12, label: "Every 12 Hours" },
  { hours: 16, label: "Every 16 Hours" },
  { hours: 20, label: "Every 20 Hours" },
  { hours: 24, label: "Every 24 Hours" },
  { hours: 30, label: "Every 30 Hours" },
  { hours: 36, label: "Every 36 Hours" },
];

function formatHoursLabel(hours: number): string {
  if (hours < 1) {
    return `every ${Math.round(hours * 60)}m of flight`;
  }
  return `every ${hours}h of flight`;
}

export function RestStopModal({
  open,
  onSelect,
  onSkip,
  onClose,
}: RestStopModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop close button is aria-hidden */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.dialog
            aria-modal="true"
            aria-labelledby="rest-stop-title"
            open
            className="relative z-10 w-[340px] max-w-[90vw] bg-[#0e0e0f] border border-[#D4AF37]/60 font-mono shadow-[0_0_40px_rgba(212,175,55,0.15)] p-0 m-0"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2F2F34]">
              <div className="flex items-center gap-2">
                <Plane size={14} className="text-[#D4AF37]" />
                <span
                  id="rest-stop-title"
                  className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase"
                >
                  FLYING MODE
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[#A7A7AD] hover:text-[#D4AF37] transition-colors"
                aria-label="Close dialog"
                data-ocid="rest_stop_modal.close_button"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-start gap-2">
                <TreePine
                  size={16}
                  className="text-[#2d7a2d] flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-[#E7E7EA] text-xs leading-relaxed">
                    How often do you want a rest stop?
                  </p>
                  <p className="text-[#A7A7AD] text-[10px] mt-1 leading-relaxed">
                    Rest stops will be mapped to nearby forests or less-crowded
                    green areas along your route.
                  </p>
                </div>
              </div>

              <div
                className="space-y-1.5 overflow-y-auto pr-1"
                style={{ maxHeight: 300 }}
              >
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => onSelect(opt.hours)}
                    className="w-full flex items-center justify-between px-3 py-2.5 border border-[#2F2F34] text-[#E7E7EA] text-xs hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors tracking-wider group"
                    data-ocid="rest_stop_modal.option.button"
                  >
                    <span>{opt.label}</span>
                    <span className="text-[#A7A7AD] text-[10px] group-hover:text-[#D4AF37]/60">
                      {formatHoursLabel(opt.hours)}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onSkip}
                className="w-full py-2 border border-dashed border-[#2F2F34] text-[#A7A7AD] text-[10px] hover:border-[#D4AF37]/40 hover:text-[#D4AF37]/60 transition-colors tracking-wider"
                data-ocid="rest_stop_modal.skip_button"
              >
                SKIP — NO REST STOPS
              </button>
            </div>
          </motion.dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
