import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Link row under the card (e.g. "Don't have an account? Create one"). */
  footer?: ReactNode;
}

/** Centred card shell shared by the login, registration and callback pages. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex flex-1 items-center justify-center py-12 sm:py-16 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">{subtitle}</p>
        <div className="mt-6 space-y-5">{children}</div>
        {footer ? <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs sm:text-sm text-slate-600">{footer}</div> : null}
      </div>
    </div>
  );
}

interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  error?: string;
}

/** Label + input + inline validation message used by the auth forms. */
export function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  const inputId = id ?? inputProps.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        {...inputProps}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 transition ${
          error ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-emerald-700'
        }`}
      />
      {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

/** Red error banner that mirrors the backend/frontend validation messages. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-xs font-medium text-rose-800">
      {message}
    </p>
  );
}

interface SubmitButtonProps {
  busy: boolean;
  busyLabel: string;
  children: ReactNode;
  disabled?: boolean;
}

/** Primary emerald action button with a pending state. */
export function SubmitButton({ busy, busyLabel, children, disabled = false }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="w-full rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white shadow-2xs hover:bg-emerald-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:scale-98"
    >
      {busy ? busyLabel : children}
    </button>
  );
}

/** "OR" separator between the password form and the Google button. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
      <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
      OR
      <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
    </div>
  );
}

interface GoogleButtonProps {
  onClick: () => void;
}

/** "Continue with Google" button. Navigates away from the SPA to the backend endpoint. */
export function GoogleButton({ onClick }: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400/50"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
        />
      </svg>
      Continue with Google
    </button>
  );
}
