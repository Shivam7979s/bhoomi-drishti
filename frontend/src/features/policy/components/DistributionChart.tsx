import { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart2, PieChart as PieIcon } from 'lucide-react';
import type { DistributionItem, RawDistribution } from '../types/policy';

interface DistributionChartProps {
  title: string;
  subtitle?: string;
  dataJson?: string | null;
  deserializedData?: Record<string, DistributionItem> | null;
  metricType?: 'area' | 'parcels';
}

interface ChartDatum {
  name: string;
  parcelCount: number;
  areaSqMeters: number;
  areaHa: number;
  percentage: number;
}

const PALETTE = [
  '#059669', // emerald-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#d97706', // amber-600
  '#0891b2', // cyan-600
  '#dc2626', // rose-600
  '#475569', // slate-600
  '#4f46e5', // indigo-600
];

export function DistributionChart({
  title,
  subtitle,
  dataJson,
  deserializedData,
  metricType = 'area',
}: DistributionChartProps) {
  const [viewMode, setViewMode] = useState<'bar' | 'donut'>('bar');
  const [selectedMetric, setSelectedMetric] = useState<'area' | 'parcels'>(metricType);

  let chartData: ChartDatum[] = [];

  if (deserializedData && Object.keys(deserializedData).length > 0) {
    chartData = Object.entries(deserializedData).map(([name, item]) => {
      const area = Number(item.areaSqMeters || 0);
      return {
        name,
        parcelCount: Number(item.parcelCount || 0),
        areaSqMeters: area,
        areaHa: Number((area / 10000).toFixed(2)),
        percentage: Number((item.areaPercentage || 0).toFixed(2)),
      };
    });
  } else if (dataJson) {
    try {
      const parsed: RawDistribution = JSON.parse(dataJson);
      let totalArea = 0;
      Object.values(parsed).forEach((p) => {
        totalArea += Number(p.areaSqMeters || 0);
      });

      chartData = Object.entries(parsed).map(([name, item]) => {
        const area = Number(item.areaSqMeters || 0);
        const pct = totalArea > 0 ? (area / totalArea) * 100 : 0;
        return {
          name,
          parcelCount: Number(item.parcelCount || 0),
          areaSqMeters: area,
          areaHa: Number((area / 10000).toFixed(2)),
          percentage: Number(pct.toFixed(2)),
        };
      });
    } catch {
      chartData = [];
    }
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <div className="mt-8 flex flex-col items-center justify-center text-center text-slate-400 py-6">
          <p className="text-xs">No distribution data available for this scenario run.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {/* Metric Selector */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSelectedMetric('area')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                selectedMetric === 'area'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Area (m²)
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('parcels')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                selectedMetric === 'parcels'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Parcels
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              title="Bar Chart"
              onClick={() => setViewMode('bar')}
              className={`p-1 rounded-md transition ${
                viewMode === 'bar'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Donut Chart"
              onClick={() => setViewMode('donut')}
              className={`p-1 rounded-md transition ${
                viewMode === 'donut'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <PieIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as ChartDatum;
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs">
                        <div className="font-semibold text-slate-900">{d.name}</div>
                        <div className="mt-1 space-y-0.5 text-slate-600">
                          <div>
                            Parcels: <span className="font-medium text-slate-800">{d.parcelCount.toLocaleString()}</span>
                          </div>
                          <div>
                            Area: <span className="font-medium text-slate-800">{d.areaSqMeters.toLocaleString()} m²</span> ({d.areaHa} ha)
                          </div>
                          <div>
                            Share: <span className="font-medium text-slate-800">{d.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey={selectedMetric === 'area' ? 'areaSqMeters' : 'parcelCount'}
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                dataKey={selectedMetric === 'area' ? 'areaSqMeters' : 'parcelCount'}
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {chartData.map((_, index) => (
                  <Cell key={`donut-cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as ChartDatum;
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs">
                        <div className="font-semibold text-slate-900">{d.name}</div>
                        <div className="mt-1 space-y-0.5 text-slate-600">
                          <div>
                            Parcels: <span className="font-medium text-slate-800">{d.parcelCount.toLocaleString()}</span>
                          </div>
                          <div>
                            Area: <span className="font-medium text-slate-800">{d.areaSqMeters.toLocaleString()} m²</span> ({d.areaHa} ha)
                          </div>
                          <div>
                            Share: <span className="font-medium text-slate-800">{d.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend / Category breakdown list */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs">
        {chartData.map((item, idx) => (
          <div key={item.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
            />
            <span className="truncate text-slate-600" title={item.name}>
              {item.name}: <span className="font-semibold text-slate-800">{item.percentage}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
