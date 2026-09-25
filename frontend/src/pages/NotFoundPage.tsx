import { Link } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center px-4 py-20 max-w-md mx-auto">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
        <FileQuestion className="h-8 w-8" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase">404 Error</p>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Page Not Found</h1>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          The requested resource or statutory view could not be located. It may have moved or requires authorized workspace credentials.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Return to Platform Home</span>
      </Link>
    </div>
  );
}
