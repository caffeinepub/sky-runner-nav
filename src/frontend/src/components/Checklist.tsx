import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import type { ChecklistItem, TravelMode } from "../types";

const CHECKLIST_DATA: Record<TravelMode, ChecklistItem[]> = {
  driving: [
    { id: "d1", label: "Check fuel level", checked: false },
    { id: "d2", label: "Verify tire pressure", checked: false },
    { id: "d3", label: "Check oil level", checked: false },
    { id: "d4", label: "Review route and stops", checked: false },
    { id: "d5", label: "Check weather forecast", checked: false },
    { id: "d6", label: "Ensure phone is charged", checked: false },
    { id: "d7", label: "Pack emergency kit", checked: false },
    { id: "d8", label: "Have ID and documents ready", checked: false },
    { id: "d9", label: "Confirm destination address", checked: false },
    { id: "d10", label: "Notify someone of your route", checked: false },
    { id: "d11", label: "Have snacks", checked: false },
    { id: "d12", label: "Have emergency money", checked: false },
    { id: "d13", label: "Have shapeshifter clothes", checked: false },
    { id: "d14", label: "Have weatherproof jacket", checked: false },
    { id: "d15", label: "Have headphones", checked: false },
    { id: "d16", label: "Have phone charger", checked: false },
    { id: "d17", label: "Have portable battery/car jumper", checked: false },
  ],
  flying: [
    { id: "f1", label: "Check flight path and route", checked: false },
    { id: "f2", label: "Check weather and wind conditions", checked: false },
    { id: "f3", label: "Check visa/entry requirements", checked: false },
    { id: "f4", label: "Download offline maps", checked: false },
    { id: "f5", label: "Have snacks", checked: false },
    { id: "f6", label: "Have emergency money", checked: false },
    { id: "f7", label: "Have shapeshifter clothes", checked: false },
    { id: "f8", label: "Have weatherproof jacket", checked: false },
    { id: "f9", label: "Have headphones", checked: false },
    { id: "f10", label: "Have phone charger", checked: false },
    { id: "f11", label: "Have portable battery", checked: false },
    { id: "f12", label: "Notify someone of your route", checked: false },
    { id: "f13", label: "Set rest stop frequency", checked: false },
    { id: "f14", label: "Identify forest rest areas on route", checked: false },
    { id: "f15", label: "Emergency landing zones noted", checked: false },
  ],
  teleport: [
    { id: "t1", label: "Verify destination coordinates", checked: false },
    { id: "t2", label: "Scan for atmospheric hazards", checked: false },
    { id: "t3", label: "Check dimensional stability", checked: false },
    { id: "t4", label: "Prepare quantum anchor", checked: false },
    { id: "t5", label: "Backup consciousness state", checked: false },
    { id: "t6", label: "Set return coordinates", checked: false },
    { id: "t7", label: "Calibrate teleport device", checked: false },
    { id: "t8", label: "Have snacks (for recovery)", checked: false },
    { id: "t9", label: "Have emergency money", checked: false },
    { id: "t10", label: "Have shapeshifter clothes", checked: false },
    { id: "t11", label: "Have weatherproof jacket", checked: false },
    { id: "t12", label: "Have headphones", checked: false },
    { id: "t13", label: "Have phone charger", checked: false },
    { id: "t14", label: "Have portable battery", checked: false },
    { id: "t15", label: "Notify arrival team", checked: false },
    { id: "t16", label: "Emergency protocol armed", checked: false },
    { id: "t17", label: "Execute teleport sequence", checked: false },
  ],
};

interface ChecklistProps {
  mode: TravelMode;
}

export function Checklist({ mode }: ChecklistProps) {
  const storageKey = `skyrunner-checklist-${mode}`;

  const [items, setItems] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedMap: Record<string, boolean> = JSON.parse(saved);
        return CHECKLIST_DATA[mode].map((item) => ({
          ...item,
          checked: savedMap[item.id] ?? false,
        }));
      }
    } catch {}
    return CHECKLIST_DATA[mode];
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedMap: Record<string, boolean> = JSON.parse(saved);
        setItems(
          CHECKLIST_DATA[mode].map((item) => ({
            ...item,
            checked: savedMap[item.id] ?? false,
          })),
        );
      } else {
        setItems(CHECKLIST_DATA[mode]);
      }
    } catch {
      setItems(CHECKLIST_DATA[mode]);
    }
  }, [mode, storageKey]);

  const toggle = (id: string) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      );
      const savedMap: Record<string, boolean> = {};
      for (const i of updated) {
        savedMap[i.id] = i.checked;
      }
      localStorage.setItem(storageKey, JSON.stringify(savedMap));
      return updated;
    });
  };

  const resetAll = () => {
    const reset = CHECKLIST_DATA[mode].map((i) => ({ ...i, checked: false }));
    setItems(reset);
    localStorage.removeItem(storageKey);
  };

  const completedCount = items.filter((i) => i.checked).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#A7A7AD]">
          {completedCount}/{items.length} COMPLETED
        </span>
        <button
          type="button"
          onClick={resetAll}
          className="text-xs text-[#A7A7AD] hover:text-[#D4AF37] transition-colors"
          data-ocid="checklist.secondary_button"
        >
          RESET
        </button>
      </div>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-2 py-1"
          data-ocid={`checklist.item.${index + 1}`}
        >
          <Checkbox
            id={item.id}
            checked={item.checked}
            onCheckedChange={() => toggle(item.id)}
            className="border-[#2F2F34] data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
            data-ocid={`checklist.checkbox.${index + 1}`}
          />
          <label
            htmlFor={item.id}
            className={`text-xs cursor-pointer transition-colors ${
              item.checked ? "text-[#A7A7AD] line-through" : "text-[#E7E7EA]"
            }`}
          >
            {item.label}
          </label>
        </div>
      ))}
    </div>
  );
}
