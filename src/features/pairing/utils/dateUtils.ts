import {
  format,
  parse,
  isSameDay as isSameDayDateFns,
  startOfDay,
} from 'date-fns';

/**
 * Formats a Date object to a local YYYY-MM-DD string using date-fns.
 * This ensures the date is formatted strictly in the user's local timezone.
 */
export function formatLocalDate(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parses a YYYY-MM-DD string into a local Date object.
 * Using date-fns `parse` explicitly creates a local midnight Date
 * without relying on the unpredictable native `new Date(string)` browser parsing.
 */
export function parseLocalDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return startOfDay(new Date());

  // Extract just the "YYYY-MM-DD" portion before parsing, ignoring any T00:00:00Z stuff
  const cleanDate = dateStr.split('T')[0];

  const parsed = parse(cleanDate, 'yyyy-MM-dd', new Date());

  // Fallback to current date if parsing results in an Invalid Date
  return isNaN(parsed.getTime()) ? startOfDay(new Date()) : parsed;
}

/**
 * Determines if two local dates represent the exact same calendar day
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return isSameDayDateFns(d1, d2);
}
