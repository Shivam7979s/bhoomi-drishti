import { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { LAND_USE_CONFIG } from '../utils/landUseStyles';
import type { LandUseType } from '../types/gis';

interface MapLegendProps {
  activeLandUses?: Set<LandUseType>;
  onToggleLandUse?: (type: LandUseType) => void;
}

export function MapLegend({ activeLandUses, onToggleLandUse }: MapLegendProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-md transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 text-xs font-semibold text-slate-800 hover:text-slate-900"
      >
        <div className="flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-emerald-600" />
          <span>Cadastral Legend</span>
        </div>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-1.5 pt-2 border-t border-slate-100">
          {(Object.keys(LAND_USE_CONFIG) as LandUseType[]).map((type) => {
            const cfg = LAND_USE_CONFIG[type];
            const isInteractive = Boolean(activeLandUses && onToggleLandUse);
            const isVisible = activeLandUses ? activeLandUses.has(type) : true;

            return (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 hover:text-slate-900 select-none py-0.5"
              >
                {isInteractive && onToggleLandUse && (
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => onToggleLandUse(type)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                )}
                <span
                  className="h-3 w-3 rounded-xs border shrink-0"
                  style={{ backgroundColor: cfg.fillColor, borderColor: cfg.borderColor }}
                />
                <span className="truncate">{cfg.label}</span>
              </label>
            );
          })}
          {activeLandUses && onToggleLandUse && (
            <div className="pt-1.5 text-[10px] text-slate-400 italic">
              Click checkboxes to filter map layers
            </div>
          )}
        </div>
      )}
    </div>
  );
}
