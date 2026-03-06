/**
 * Formats a Date object to a local YYYY-MM-DD string.
 * This is "robust" because it avoids the UTC roll-forward issue
 * of .toISOString().split('T')[0]
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date object.
 * This is "robust" because it treats the date as local time
 * (midnight in user's timezone) instead of browser-default UTC.
 */
export function parseLocalDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();

  // Handle optional ISO timestamps by taking only the date part
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDate.split('-');

  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    // Month is zero-indexed in JS Date constructor
    return new Date(year, month - 1, day);
  }

  // Fallback for non-YYYY-MM-DD formats
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Compares two dates just by their YYYY-MM-DD part
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return formatLocalDate(d1) === formatLocalDate(d2);
}
