import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthCard, AuthDivider, FormError, FormField, GoogleButton, SubmitButton } from '../components/AuthFormParts';
import { useAuth } from '../hooks/useAuth';
import { messageForError } from '../utils/messages';
import { validateRegistration } from '../utils/messages';
import type { RegistrationValidation } from '../utils/messages';

/**
 * Public sovereign self-registration.
 * Captures Full Name, Date of Birth (for statutory 18+ age verification & DigiLocker matching),
 * Email and Password.
 */
export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next');

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
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
      await register({ name: name.trim(), dob, email: email.trim(), password });
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
      subtitle="Join BHOOMI-DRISHTI with an authenticated profile. Accounts start with verified Citizen clearance."
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
          placeholder="you@example.com"
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
        <SubmitButton busy={submitting} busyLabel="Creating account...">
          Create Account
        </SubmitButton>
      </form>

      <AuthDivider />
      <GoogleButton onClick={loginWithGoogle} />
    </AuthCard>
  );
}
