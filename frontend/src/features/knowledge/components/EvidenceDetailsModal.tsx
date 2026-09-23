import { useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  FileText,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { EvidenceItem } from '../types/knowledge';

interface EvidenceDetailsModalProps {
  evidence: EvidenceItem | null;
  onClose: () => void;
}

export function EvidenceDetailsModal({
  evidence,
  onClose,
}: EvidenceDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!evidence) return null;

  const handleCopyCitation = () => {
    if (evidence.citation) {
      navigator.clipboard.writeText(evidence.citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(evidence.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const similarityPercent = Math.round(evidence.similarity * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Evidence Provenance & Verification
              </h3>
              <p className="text-xs text-slate-500">
                Ground-truth excerpt with exact page and section citation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Document Title & Type */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-700 border border-blue-200">
                {evidence.documentType.replace(/_/g, ' ')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                {similarityPercent}% match
              </span>
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              {evidence.documentTitle}
            </h4>
            {(evidence.authors || evidence.organization) && (
              <p className="text-xs text-slate-600 mt-1">
                {evidence.authors && <span>By {evidence.authors}</span>}
                {evidence.authors && evidence.organization && <span> • </span>}
                {evidence.organization && <span>{evidence.organization}</span>}
              </p>
            )}
          </div>

          {/* Full Evidence Text */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <FileText className="h-3.5 w-3.5 text-teal-600" />
                Extracted Evidence Content
              </span>
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy Excerpt'}</span>
              </button>
            </div>
            <blockquote className="border-l-2 border-teal-500 pl-3 text-sm leading-relaxed text-slate-800 italic font-serif">
              "{evidence.text}"
            </blockquote>
          </div>

          {/* Provenance Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <span className="text-slate-400 block mb-0.5">Page Location</span>
              <span className="font-semibold text-slate-800">
                {evidence.pageNumber != null
                  ? `Page ${evidence.pageNumber}`
                  : 'Document Level'}
              </span>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <span className="text-slate-400 block mb-0.5">Section / Heading</span>
              <span className="font-semibold text-slate-800 truncate block">
                {evidence.sectionTitle || 'General Content'}
              </span>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <span className="text-slate-400 block mb-0.5">Vector Similarity</span>
              <span className="font-semibold text-slate-800">
                {evidence.similarity.toFixed(4)} (Cosine)
              </span>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <span className="text-slate-400 block mb-0.5">Linked Land Records</span>
              <span className="font-semibold text-slate-800">
                {evidence.linkedLandRecordsCount} linked
              </span>
            </div>
          </div>

          {/* Citation String */}
          {evidence.citation && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                  Academic / Policy Citation
                </span>
                <button
                  onClick={handleCopyCitation}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 font-mono bg-slate-50 rounded-md p-2.5 select-all">
                {evidence.citation}
              </p>
            </div>
          )}

          {/* Source Link */}
          {evidence.sourceUrl && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">Original Document Source:</span>
              <a
                href={evidence.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium hover:underline"
              >
                <span>Open Source Document</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* System Disclaimer */}
          <div className="rounded-lg bg-teal-50/60 border border-teal-100 p-3 text-[11px] text-teal-800 leading-normal">
            <strong>Bhoomi-Drishti Evidence Policy:</strong> This excerpt is directly
            extracted from source files without synthetic generative LLM synthesis.
            Vector search surfaces semantic matches while preserving exact provenance.
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
