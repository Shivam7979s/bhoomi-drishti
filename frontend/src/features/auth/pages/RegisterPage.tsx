import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthCard, AuthDivider, FormError, FormField, GoogleButton, SubmitButton } from '../components/AuthFormParts';
import { useAuth } from '../hooks/useAuth';
import { messageForError } from '../utils/messages';
import { validateRegistration } from '../utils/messages';
import type { RegistrationValidation } from '../utils/messages';
import type { Role } from '../types/auth';
import { User, Briefcase, Landmark } from 'lucide-react';

const ROLE_OPTIONS: {
  role: Role;
  label: string;
  badge: string;
  desc: string;
  icon: typeof User;
}[] = [
  {
    role: 'PUBLIC',
    label: 'Citizen / Landowner',
    badge: 'Public Clearance',
    desc: 'Access your verified land records, masked cadastral maps, and statutory AI assistant.',
    icon: User,
  },
  {
    role: 'RESEARCHER',
    label: 'Policy Researcher',
    badge: 'Research Clearance',
    desc: 'Access collaborative workspaces, spatial vector dossiers, and policy simulation models.',
    icon: Briefcase,
  },
  {
    role: 'GOVERNMENT_OFFICIAL',
    label: 'Revenue Officer',
    badge: 'Official Clearance',
    desc: 'Revenue department cadastre administration, unmasked title deeds, and dispute governance.',
    icon: Landmark,
  },
];

/**
 * Sovereign self-registration.
 * Captures Full Name, Date of Birth (for statutory 18+ verification), Account Role, Email and Password.
 * The role is decided at registration time and cryptographically locked to the user's database record.
 */
export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next');

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('PUBLIC');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegistrationValidation>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Today's date in YYYY-MM-DD for max date constraint
  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateRegistration({ name, dob, email, password, confirm });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(null);
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        dob,
        email: email.trim(),
        password,
        role: selectedRole,
      });
      navigate(next && next.startsWith('/') ? next : '/dashboard', { replace: true });
    } catch (cause) {
      setFormError(messageForError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your sovereign account"
      subtitle="Register with your authentic role and identity credentials. Your role is verified and enforced by the sovereign database."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormError message={formError} />

        {/* ── Account Role Selection at Registration Time ── */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Account Category & Clearance
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedRole === opt.role;
              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => setSelectedRole(opt.role)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">{opt.label}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedRole === 'GOVERNMENT_OFFICIAL' && (
            <p className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 p-2.5 rounded-xl">
              Official Revenue Clearance: In production, verified through Jan Parichay (e-Pramaan SSO) and state cadastral nodal officer authorization.
            </p>
          )}
        </div>

        <FormField
          label="Full name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Shivam Sharma"
          value={name}
          error={fieldErrors.name}
          onChange={(event) => setName(event.target.value)}
        />

        <div>
          <FormField
            label="Date of birth"
            name="dob"
            type="date"
            autoComplete="bday"
            max={today}
            value={dob}
            error={fieldErrors.dob}
            onChange={(event) => setDob(event.target.value)}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Required for DigiLocker & land title matching (18+ years per Indian Contract Act 1872).
          </p>
        </div>

        <FormField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={selectedRole === 'GOVERNMENT_OFFICIAL' ? 'officer@revenue.mp.gov.in' : 'you@example.com'}
          value={email}
          error={fieldErrors.email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          error={fieldErrors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <FormField
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat the password"
          value={confirm}
          error={fieldErrors.confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />

        <SubmitButton busy={submitting} busyLabel="Creating verified account...">
          Create Verified Account
        </SubmitButton>
      </form>

      <AuthDivider />
      <GoogleButton onClick={loginWithGoogle} />
    </AuthCard>
  );
}
