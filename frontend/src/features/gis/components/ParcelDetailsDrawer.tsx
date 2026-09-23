import { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Layers,
  Search,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GeoJsonFeature } from '../types/gis';
import { LAND_USE_CONFIG } from '../utils/landUseStyles';
import { getLinkedResearchDocuments } from '../../research/services/researchService';
import { searchKnowledge } from '../../knowledge/services/knowledgeService';
import type { ResearchDocument } from '../../research/types/research';
import type { EvidenceItem } from '../../knowledge/types/knowledge';

interface ParcelDetailsDrawerProps {
  feature: GeoJsonFeature | null;
  onClose: () => void;
  onZoomToParcel?: (feature: GeoJsonFeature) => void;
}

export function ParcelDetailsDrawer({
  feature,
  onClose,
  onZoomToParcel,
}: ParcelDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'research' | 'evidence'>('details');
  const [copied, setCopied] = useState(false);

  // Research documents state
  const [researchDocs, setResearchDocs] = useState<ResearchDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // AI Evidence state
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [evidenceQuery, setEvidenceQuery] = useState('');

  useEffect(() => {
    if (!feature) return;

    // Reset states when feature changes
    setActiveTab('details');
    setEvidenceList([]);
    const defaultQuery = `${feature.properties.village} ${feature.properties.landUseType.toLowerCase()} land`;
    setEvidenceQuery(defaultQuery);

    // Fetch linked research documents
    setLoadingDocs(true);
    getLinkedResearchDocuments(feature.id, 0, 10)
      .then((res) => {
        setResearchDocs(res.content || []);
      })
      .catch((err) => {
        console.error('Failed to load linked research documents:', err);
        setResearchDocs([]);
      })
      .finally(() => setLoadingDocs(false));
  }, [feature?.id]);

  if (!feature) return null;

  const props = feature.properties;
  const landUse = LAND_USE_CONFIG[props.landUseType] || LAND_USE_CONFIG.OTHER;
  const areaInHectares = (props.landAreaSqMeters / 10000).toFixed(4);

  const statusColors = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    INACTIVE: 'bg-slate-100 text-slate-700 ring-slate-600/20',
    DISPUTED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    PENDING_VERIFICATION: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  };

  const handleCopyGeoJson = () => {
    navigator.clipboard.writeText(JSON.stringify(feature.geometry, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFetchEvidence = async (queryText?: string) => {
    const q = queryText || evidenceQuery || `${props.village} ${props.landUseType.toLowerCase()}`;
    setLoadingEvidence(true);
    try {
      const res = await searchKnowledge({ query: q, topK: 5 });
      setEvidenceList(res.results || []);
    } catch (err) {
      console.error('Failed to search evidence for parcel:', err);
      setEvidenceList([]);
    } finally {
      setLoadingEvidence(false);
    }
  };

  return (
    <aside
      className="absolute top-0 right-0 z-30 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-all duration-300 sm:w-96 md:w-[28rem]"
      aria-label="Parcel Details"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg shadow-xs"
            style={{ backgroundColor: `${landUse.fillColor}20`, color: landUse.fillColor }}
          >
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{props.parcelNumber}</h2>
            <p className="text-xs text-slate-500">
              Survey: <span className="font-medium text-slate-700">{props.surveyNumber || 'N/A'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusColors[props.status] || ''}`}
          >
            {props.status}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close parcel drawer"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-5">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-1.5 border-b-2 py-2.5 text-xs font-semibold transition ${
            activeTab === 'details'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Parcel Info
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('research')}
          className={`relative ml-4 flex items-center gap-1.5 border-b-2 py-2.5 text-xs font-semibold transition ${
            activeTab === 'research'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Research Hub
          {researchDocs.length > 0 && (
            <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
              {researchDocs.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('evidence');
            if (evidenceList.length === 0) handleFetchEvidence();
          }}
          className={`ml-4 flex items-center gap-1.5 border-b-2 py-2.5 text-xs font-semibold transition ${
            activeTab === 'evidence'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
          AI Evidence
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 text-sm space-y-5">
        {activeTab === 'details' && (
          <>
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Land Use
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: landUse.fillColor }}
                  />
                  <span className="font-semibold text-slate-800">{landUse.label}</span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Ownership
                </span>
                <span className="mt-1 block font-semibold text-slate-800">
                  {props.ownershipType}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Area (Sq. M)
                </span>
                <span className="mt-1 block font-semibold text-slate-800">
                  {props.landAreaSqMeters?.toLocaleString() || 0} m²
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Area (Hectares)
                </span>
                <span className="mt-1 block font-semibold text-slate-800">
                  {areaInHectares} ha
                </span>
              </div>
            </div>

            {/* Location Hierarchy */}
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Administrative Location
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">State:</span>
                  <p className="font-medium text-slate-800">{props.state}</p>
                </div>
                <div>
                  <span className="text-slate-400">District:</span>
                  <p className="font-medium text-slate-800">{props.district}</p>
                </div>
                <div>
                  <span className="text-slate-400">Tehsil:</span>
                  <p className="font-medium text-slate-800">{props.tehsil}</p>
                </div>
                <div>
                  <span className="text-slate-400">Village:</span>
                  <p className="font-medium text-slate-800">{props.village}</p>
                </div>
              </div>
            </div>

            {/* Privacy & Ownership Section */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Owner Information
                </h3>
                {props.ownerName ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                )}
              </div>

              <div className="mt-3">
                {props.ownerName ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-slate-400">Registered Owner:</span>
                      <p className="font-semibold text-slate-800">{props.ownerName}</p>
                    </div>
                    {props.ownerIdentifier && (
                      <div>
                        <span className="text-xs text-slate-400">Identifier:</span>
                        <p className="font-mono text-xs text-slate-700">{props.ownerIdentifier}</p>
                      </div>
                    )}
                    <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                      Authorized View (Government / Admin)
                    </span>
                  </div>
                ) : (
                  <div className="rounded-lg bg-amber-50/60 p-3 text-xs text-amber-800 border border-amber-200/60">
                    <p className="font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                      Protected for Privacy
                    </p>
                    <p className="mt-1 text-slate-600">
                      Owner personal identification is withheld in public and research modes in
                      compliance with digital land data governance guidelines.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Geometry actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyGeoJson}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Copied GeoJSON
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Geometry
                  </>
                )}
              </button>

              {onZoomToParcel && (
                <button
                  type="button"
                  onClick={() => onZoomToParcel(feature)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Center
                </button>
              )}
            </div>
          </>
        )}

        {/* Research Hub Tab */}
        {activeTab === 'research' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Linked Research Documents ({researchDocs.length})
              </h3>
              <Link
                to={`/research?search=${encodeURIComponent(props.village)}`}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Browse Hub <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {loadingDocs ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              </div>
            ) : researchDocs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-xs font-medium text-slate-600">
                  No research documents linked to this parcel.
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Researchers and officials can attach studies, surveys, and legal records via the Research Hub.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {researchDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="group rounded-xl border border-slate-200 bg-white p-3.5 hover:border-emerald-300 hover:shadow-xs transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition line-clamp-2">
                        {doc.title}
                      </h4>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 uppercase">
                        {doc.documentType}
                      </span>
                    </div>
                    {doc.abstractText && (
                      <p className="mt-1.5 text-[11px] text-slate-500 line-clamp-2">
                        {doc.abstractText}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                      <span>{doc.authors || doc.organization || 'Research Team'}</span>
                      <Link
                        to={`/research?doc=${doc.id}`}
                        className="font-semibold text-emerald-600 hover:underline flex items-center gap-0.5"
                      >
                        View <ChevronRight className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Phase 5 AI Evidence Tab */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Phase 5 Knowledge Retrieval
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Retrieve vector-matched evidence chunks relevant to this parcel's geography and use.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={evidenceQuery}
                onChange={(e) => setEvidenceQuery(e.target.value)}
                placeholder="Query parcel knowledge..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => handleFetchEvidence()}
                disabled={loadingEvidence}
                className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {loadingEvidence ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
                Search
              </button>
            </div>

            {loadingEvidence ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
              </div>
            ) : evidenceList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-purple-300" />
                <p className="mt-2 text-xs font-medium text-slate-600">
                  No semantic evidence retrieved for this parcel query.
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Try broader terms like "land ownership", "survey", or the tehsil name.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {evidenceList.map((item) => (
                  <div
                    key={item.chunkId}
                    className="rounded-xl border border-purple-100 bg-purple-50/30 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-purple-900">
                      <span className="line-clamp-1">{item.documentTitle}</span>
                      <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] text-purple-700 shrink-0">
                        {Math.round(item.similarity * 100)}% match
                      </span>
                    </div>

                    <blockquote className="mt-2 border-l-2 border-purple-300 pl-2 text-[11px] text-slate-700 italic line-clamp-4">
                      "{item.text}"
                    </blockquote>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {item.sectionTitle || 'Section'} {item.pageNumber ? `(p. ${item.pageNumber})` : ''}
                      </span>
                      {item.citation && (
                        <span className="truncate max-w-[120px]">{item.citation}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
