import {
  BookOpen,
  Calendar,
  Check,
  Bookmark,
  ExternalLink,
  FileText,
  MapPin,
  Sparkles,
  User,
} from 'lucide-react';
import { useState } from 'react';
import type { EvidenceItem } from '../types/knowledge';
import { saveResearch } from '../../collaboration/services/collaborationService';

interface EvidenceCardProps {
  evidence: EvidenceItem;
  onSelect: (evidence: EvidenceItem) => void;
}

export function EvidenceCard({ evidence, onSelect }: EvidenceCardProps) {
  const similarityPercent = Math.round(evidence.similarity * 100);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveEvidence = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving || saved) return;
    setIsSaving(true);
    try {
      await saveResearch({
        title: `${evidence.documentTitle} (Evidence)`,
        documentChunkId: evidence.chunkId,
        researchDocumentId: evidence.documentId,
        notes: evidence.sectionTitle ? `Section: ${evidence.sectionTitle}` : undefined,
        tags: evidence.documentType,
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save evidence:', err);
    } finally {
      setIsSaving(false);
    }
  };

  function getSimilarityBadgeClass(score: number) {
    if (score >= 0.8) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (score >= 0.65) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  function getTypeBadgeClass(type: string) {
    switch (type) {
      case 'RESEARCH_PAPER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'POLICY_DOCUMENT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'GOVERNMENT_REPORT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ACADEMIC_PUBLICATION':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-teal-300 hover:shadow-md">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${getTypeBadgeClass(
                evidence.documentType,
              )}`}
            >
              {evidence.documentType.replace(/_/g, ' ')}
            </span>
            {evidence.pageNumber != null && (
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                Page {evidence.pageNumber}
              </span>
            )}
            {evidence.sectionTitle && (
              <span className="inline-flex max-w-[200px] truncate items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                § {evidence.sectionTitle}
              </span>
            )}
          </div>

          {/* Similarity match badge */}
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getSimilarityBadgeClass(
              evidence.similarity,
            )}`}
          >
            <Sparkles className="h-3 w-3" />
            {similarityPercent}% match
          </span>
        </div>

        {/* Document Title */}
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-teal-700 transition line-clamp-2 mb-1.5">
          {evidence.documentTitle}
        </h3>

        {/* Authors & Organization */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mb-3">
          {evidence.authors && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{evidence.authors}</span>
            </span>
          )}
          {evidence.organization && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{evidence.organization}</span>
            </span>
          )}
          {evidence.publicationDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{evidence.publicationDate}</span>
            </span>
          )}
        </div>

        {/* Evidence Excerpt Box */}
        <div className="relative rounded-lg border border-slate-100 bg-slate-50/70 p-3 mb-4">
          <p className="text-xs leading-relaxed text-slate-700 italic font-serif line-clamp-4">
            "{evidence.text}"
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          {evidence.linkedLandRecordsCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 border border-teal-200">
              <MapPin className="h-3 w-3" />
              {evidence.linkedLandRecordsCount} parcel
              {evidence.linkedLandRecordsCount === 1 ? '' : 's'} linked
            </span>
          )}
          {evidence.sourceUrl && (
            <a
              href={evidence.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-teal-600 transition"
              title="Open Source URL"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveEvidence}
            disabled={isSaving}
            className={`inline-flex items-center gap-1 text-xs font-medium transition ${
              saved
                ? 'text-emerald-600 font-semibold'
                : 'text-slate-500 hover:text-emerald-700'
            }`}
            title="Save this evidence chunk to your research workspace"
          >
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5" />
                <span>Save</span>
              </>
            )}
          </button>

          <button
            onClick={() => onSelect(evidence)}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-800 transition"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Inspect Provenance</span>
          </button>
        </div>
      </div>
    </div>
  );
}
