import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthCard, AuthDivider, FormError, FormField, GoogleButton, SubmitButton } from '../components/AuthFormParts';
import { useAuth } from '../hooks/useAuth';
import { messageForError } from '../utils/messages';
import { validateRegistration } from '../utils/messages';
import type { RegistrationValidation } from '../utils/messages';

/**
 * Public self-registration. Only name/email/password are sent - the backend always assigns the
 * PUBLIC role; no role value ever comes from the client.
 */
export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegistrationValidation>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateRegistration({ name, email, password, confirm });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(null);
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate(next && next.startsWith('/') ? next : '/dashboard', { replace: true });
    } catch (cause) {
      setFormError(messageForError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join BHOOMI-DRISHTI with an email and password. New accounts start with the PUBLIC role."
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
        <FormField
          label="Email"
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
          Create account
        </SubmitButton>
      </form>

      <AuthDivider />
      <GoogleButton onClick={loginWithGoogle} />
    </AuthCard>
  );
}
