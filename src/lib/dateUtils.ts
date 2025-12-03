// Utility functions for handling dates in Brazil timezone (America/Sao_Paulo)

/**
 * Formats a Date object to YYYY-MM-DD string in Brazil timezone
 */
export function formatDateToBrazil(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets the day of week (0-6) from a date string (YYYY-MM-DD) treating it as local date
 */
export function getDayOfWeekFromDateString(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay();
}

/**
 * Parses a YYYY-MM-DD string to a Date object in local timezone
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Gets today's date formatted as YYYY-MM-DD in local timezone
 */
export function getTodayString(): string {
  return formatDateToBrazil(new Date());
}

/**
 * Compares if a date string is before today (local timezone)
 */
export function isDateBeforeToday(dateString: string): boolean {
  const today = getTodayString();
  return dateString < today;
}
