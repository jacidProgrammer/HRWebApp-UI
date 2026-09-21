/** Stable, non-cryptographic string hash (FNV-1a) for picking a colour per person or department. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export const AVATAR_COLORS = 8;
export const DEPARTMENT_COLORS = 8;

export function avatarColorIndex(seed: string): number {
  return hashString(seed.toLowerCase()) % AVATAR_COLORS;
}

/** The demo departments get fixed, well-separated hues; any other department is hashed. */
const KNOWN_DEPARTMENTS: Record<string, number> = { it: 0, sales: 1, people: 2, finance: 3 };

export function departmentColorIndex(department: string): number {
  const key = department.trim().toLowerCase();
  return KNOWN_DEPARTMENTS[key] ?? hashString(key) % DEPARTMENT_COLORS;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}
