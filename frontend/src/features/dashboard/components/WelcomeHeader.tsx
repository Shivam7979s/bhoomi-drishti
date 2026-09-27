import { useAuth } from '../../auth/hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';

export function WelcomeHeader() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const displayName = user?.name || 'Citizen';

  return (
    <div className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/90 pb-5">
      <div className="flex items-center gap-4">
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="h-14 w-14 rounded-full object-cover border-2 border-emerald-600/40 shadow-md ring-2 ring-emerald-500/20 shrink-0"
          />
        ) : null}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            {t.welcome.greeting},{' '}
            <span className="bg-gradient-to-r from-emerald-800 via-teal-800 to-blue-900 bg-clip-text text-transparent">
              {displayName}
            </span>{' '}
            !
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
            {t.welcome.subtitle}
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-2.5 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold shadow-2xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
        </span>
        <span>{t.welcome.verifiedCitizen}</span>
      </div>
    </div>
  );
}
