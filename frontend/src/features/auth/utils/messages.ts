import { ApiError } from '../../../services/apiClient';

/**
 * Maps any thrown error to a short, user-safe message. Stack traces and internal details are
 * never shown; the backend error body already contains a curated `message`.
 */
export function messageForError(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (cause.status === null) return 'Could not reach the server. Please try again.';
    if (cause.status === 401) return 'Invalid email or password.';
    return cause.message || 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

/** Maps the `?error=` code the backend appends to the Google redirect. */
export function messageForOauthError(code: string | null): string | null {
  switch (code) {
    case null:
    case '':
      return null;
    case 'email_not_verified':
      return 'Your Google email address is not verified. Verify it with Google and try again.';
    case 'account_conflict':
      return 'This email address already belongs to a different Google account.';
    case 'missing_email':
      return 'Google did not provide an email address for this account.';
    case 'access_denied':
      return 'Google sign-in was cancelled.';
    default:
      return 'Google sign-in failed. Please try again.';
  }
}

export interface RegistrationValidation {
  name?: string;
  dob?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export function validateRegistration(input: {
  name: string;
  dob?: string;
  email: string;
  password: string;
  confirm: string;
}): RegistrationValidation {
  const errors: RegistrationValidation = {};
  const name = input.name.trim();
  const email = input.email.trim();

  if (!name) errors.name = 'Enter your full name.';
  else if (name.length > 120) errors.name = 'Name must be at most 120 characters.';

  if (!input.dob) {
    errors.dob = 'Date of birth is required for sovereign identity verification.';
  } else {
    const birthDate = new Date(input.dob);
    const today = new Date();
    if (isNaN(birthDate.getTime()) || birthDate > today) {
      errors.dob = 'Enter a valid date of birth in the past.';
    } else {
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.dob = 'You must be at least 18 years old for registered land governance eligibility.';
      }
    }
  }

  if (!email) errors.email = 'Enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';

  if (!input.password) errors.password = 'Enter a password.';
  else if (input.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (input.password.length > 72) errors.password = 'Password must be at most 72 characters.';

  if (input.confirm !== input.password) errors.confirm = 'Passwords do not match.';

  return errors;
}
