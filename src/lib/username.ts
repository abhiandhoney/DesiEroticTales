export const USERNAME_MIN = 3;
export const USERNAME_MAX = 24;
export const USERNAME_COOLDOWN_DAYS = 30;

const RESERVED = new Set([
  'api', 'auth', 'callback', 'edit', 'home', 'login', 'onboarding',
  'profile', 'stories', 'story', 'submit', 'writer', 'writers', 'www',
  'desierotictales', 'support', 'help', 'about', 'null', 'undefined',
]);

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export function getAdminEmail(): string {
  return (import.meta.env.VITE_ADMIN_EMAIL ?? '').trim().toLowerCase();
}

export function isPrivilegedAdminUser(email: string | null | undefined): boolean {
  const admin = getAdminEmail();
  return !!admin && !!email && email.trim().toLowerCase() === admin;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** True when only the site owner (VITE_ADMIN_EMAIL) may use the exact handle "admin". */
export function isAllowedAdminUsername(name: string, userEmail?: string | null): boolean {
  return name === 'admin' && isPrivilegedAdminUser(userEmail);
}

export function validateUsername(raw: string, userEmail?: string | null): string | null {
  const name = normalizeUsername(raw);
  if (name.length < USERNAME_MIN || name.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.`;
  }
  if (!USERNAME_RE.test(name)) {
    return 'Use only letters, numbers, and underscores.';
  }
  if (name.includes('admin') && !isAllowedAdminUsername(name, userEmail)) {
    return 'Usernames containing "admin" are not allowed.';
  }
  if (RESERVED.has(name)) {
    return 'This username is reserved.';
  }
  if (/^_|_$|__/.test(name)) {
    return 'Username cannot start/end with underscore or contain double underscores.';
  }
  return null;
}

export function canChangeUsername(
  changedAt: string | null | undefined,
  options?: { userEmail?: string | null; targetUsername?: string },
): boolean {
  if (
    options?.targetUsername &&
    isAllowedAdminUsername(normalizeUsername(options.targetUsername), options.userEmail)
  ) {
    return true;
  }
  if (!changedAt) return true;
  const last = new Date(changedAt).getTime();
  const cooldown = USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - last >= cooldown;
}

export function daysUntilUsernameChange(changedAt: string | null | undefined): number {
  if (!changedAt) return 0;
  const last = new Date(changedAt).getTime();
  const cooldown = USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const remaining = cooldown - (Date.now() - last);
  return remaining > 0 ? Math.ceil(remaining / (24 * 60 * 60 * 1000)) : 0;
}