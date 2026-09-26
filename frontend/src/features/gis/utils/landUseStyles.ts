import type { LandUseType } from '../types/gis';

export interface LandUseStyleConfig {
  label: string;
  fillColor: string;
  borderColor: string;
  badgeClass: string;
  description: string;
}

export const LAND_USE_CONFIG: Record<LandUseType, LandUseStyleConfig> = {
  AGRICULTURAL: {
    label: 'Agricultural',
    fillColor: '#10b981', // emerald-500
    borderColor: '#047857', // emerald-700
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Farming, crop cultivation, and orchards',
  },
  RESIDENTIAL: {
    label: 'Residential',
    fillColor: '#3b82f6', // blue-500
    borderColor: '#1d4ed8', // blue-700
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Housing settlements, abadi, and townships',
  },
  COMMERCIAL: {
    label: 'Commercial',
    fillColor: '#f59e0b', // amber-500
    borderColor: '#b45309', // amber-700
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Markets, retail, and business complexes',
  },
  INDUSTRIAL: {
    label: 'Industrial',
    fillColor: '#8b5cf6', // purple-500
    borderColor: '#6d28d9', // purple-700
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Manufacturing, logistics, and processing zones',
  },
  GOVERNMENT: {
    label: 'Government',
    fillColor: '#ef4444', // red-500
    borderColor: '#b91c1c', // red-700
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    description: 'Public offices, civic facilities, and revenue land',
  },
  FOREST: {
    label: 'Forest / Eco',
    fillColor: '#059669', // teal-600
    borderColor: '#064e3b', // teal-900
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    description: 'Protected woodland, reserved forests, and eco-zones',
  },
  OTHER: {
    label: 'Other / Mixed',
    fillColor: '#64748b', // slate-500
    borderColor: '#334155', // slate-700
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Unclassified, open spaces, or mixed purpose',
  },
};

export function getParcelPathStyle(
  landUseOrFeature: LandUseType | any,
  isHovered: boolean = false,
  isSelected: boolean = false
) {
  const landUseType: LandUseType =
    typeof landUseOrFeature === 'string'
      ? landUseOrFeature
      : landUseOrFeature?.properties?.landUseType || 'OTHER';

  const cfg = LAND_USE_CONFIG[landUseType] || LAND_USE_CONFIG.OTHER;

  if (isSelected) {
    return {
      fillColor: cfg.fillColor,
      fillOpacity: 0.65,
      color: '#06b6d4', // cyan-500 bright selection ring
      weight: 4,
      dashArray: '4, 4',
    };
  }

  if (isHovered) {
    return {
      fillColor: cfg.fillColor,
      fillOpacity: 0.6,
      color: cfg.borderColor,
      weight: 3,
    };
  }

  return {
    fillColor: cfg.fillColor,
    fillOpacity: 0.35,
    color: cfg.borderColor,
    weight: 1.5,
  };
}
