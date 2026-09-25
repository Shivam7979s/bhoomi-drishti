import type { CitationDTO } from '../types/assistant';

interface CitationChipProps {
  citationIndex: number;
  citation?: CitationDTO;
  onClick?: (citation: CitationDTO) => void;
}

/**
 * Interactive citation chip embedded inline within the synthesized answer text.
 * When clicked, triggers provenance inspection via the existing EvidenceDetailsModal.
 */
export function CitationChip({
  citationIndex,
  citation,
  onClick,
}: CitationChipProps) {
  if (!citation) {
    // Unmatched citation reference fallback: safe rendering without crashing
    return (
      <span
        className="inline-flex items-center text-xs font-semibold text-slate-400 select-none px-0.5"
        title={`Citation reference [${citationIndex}]`}
      >
        [{citationIndex}]
      </span>
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(citation);
  };

  const titleTooltip = `${citation.documentTitle}${
    citation.pageNumber ? ` (Page ${citation.pageNumber})` : ''
  }`;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Citation [${citationIndex}]: ${citation.documentTitle}`}
      title={titleTooltip}
      className="inline-flex items-center justify-center mx-0.5 px-1.5 py-0.5 rounded-md bg-teal-100 hover:bg-teal-200 text-teal-800 text-xs font-bold transition border border-teal-300 shadow-2xs hover:shadow-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 cursor-pointer align-baseline"
    >
      [{citationIndex}]
    </button>
  );
}
