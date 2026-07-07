import { isPrivilegedAdminUser } from './username';

/** Never expose the site owner email in the UI. */
export function displayUserEmail(email: string | null | undefined): string {
  if (!email) return '';
  if (isPrivilegedAdminUser(email)) return 'Site administrator';
  return maskEmail(email);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '••••••';
  const maskedLocal = `${local.charAt(0)}${'•'.repeat(Math.max(2, local.length - 1))}`;
  const [host, ...tld] = domain.split('.');
  const maskedHost = `${host.charAt(0)}${'•'.repeat(Math.max(2, host.length - 1))}`;
  return `${maskedLocal}@${maskedHost}${tld.length ? `.${tld.join('.')}` : ''}`;
}

/** Fallback label when username is unset — never derive from admin email. */
export function accountDisplayLabel(
  email: string | null | undefined,
  username?: string | null,
  displayName?: string | null,
): string {
  if (displayName?.trim()) return displayName.trim();
  if (username?.trim()) return username.trim();
  if (isPrivilegedAdminUser(email)) return 'admin';
  return email?.split('@')[0] ?? 'user';
}