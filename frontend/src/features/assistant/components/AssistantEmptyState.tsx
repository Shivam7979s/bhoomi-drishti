import { BookOpen, Compass, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface AssistantEmptyStateProps {
  onSelectQuery: (query: string) => void;
}

export function AssistantEmptyState({ onSelectQuery }: AssistantEmptyStateProps) {
  const { t } = useLanguage();

  const exampleQueries = [
    {
      category: t.assistantPage.catLandTransfer,
      query: t.assistantPage.queryLandTransfer,
    },
    {
      category: t.assistantPage.catCadastralStandards,
      query: t.assistantPage.queryCadastralStandards,
    },
    {
      category: t.assistantPage.catRecordOfRights,
      query: t.assistantPage.queryRecordOfRights,
    },
    {
      category: t.assistantPage.catForestTribalRights,
      query: t.assistantPage.queryForestTribalRights,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-7 sm:p-9 shadow-sm">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 mb-4 border border-emerald-200 shadow-2xs">
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
          {t.assistantPage.emptyTitle}
        </h2>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          {t.assistantPage.emptySubtitle}
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 mb-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
            <span>{t.assistantPage.featureStrictGroundingTitle}</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {t.assistantPage.featureStrictGroundingSub}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 mb-1.5">
            <BookOpen className="h-4 w-4 text-teal-700 shrink-0" aria-hidden="true" />
            <span>{t.assistantPage.featureInteractiveProvenanceTitle}</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {t.assistantPage.featureInteractiveProvenanceSub}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 mb-1.5">
            <Compass className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
            <span>{t.assistantPage.featureZeroHallucinationTitle}</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {t.assistantPage.featureZeroHallucinationSub}
          </p>
        </div>
      </div>

      {/* Suggested Example Questions */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center sm:text-left">
          {t.assistantPage.suggestedQueriesTitle}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exampleQueries.map((eq) => (
            <button
              key={eq.query}
              type="button"
              onClick={() => onSelectQuery(eq.query)}
              className="flex flex-col items-start rounded-xl border border-slate-200/90 bg-slate-50/50 p-3.5 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40 group cursor-pointer shadow-2xs"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                {eq.category}
              </span>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-950 mt-1">
                "{eq.query}"
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
