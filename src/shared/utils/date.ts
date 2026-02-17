import { format, parseISO, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Format date for display in UI
 */
export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: es });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Get relative time string (e.g., "hace 2 horas")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(dateObj)) {
    return `Hoy ${format(dateObj, 'HH:mm')}`;
  }

  if (isYesterday(dateObj)) {
    return `Ayer ${format(dateObj, 'HH:mm')}`;
  }

  return formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
}

/**
 * Get date string for API queries (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get start of day (00:00:00)
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day (23:59:59)
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Check if date is today
 */
export function isTodayDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isToday(dateObj);
}

/**
 * Get date range for last N days
 */
export function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return {
    start: getStartOfDay(start),
    end: getEndOfDay(end)
  };
}

/**
 * Parse date from input (supports DD/MM/YYYY and YYYY-MM-DD)
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Try DD/MM/YYYY
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const matchDDMMYYYY = dateString.match(ddmmyyyy);
  if (matchDDMMYYYY) {
    const [, day, month, year] = matchDDMMYYYY;
    return new Date(`${year}-${month}-${day}`);
  }

  // Try ISO format
  try {
    return parseISO(dateString);
  } catch {
    return null;
  }
}
