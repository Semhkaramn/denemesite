import { format as dateFnsFormat } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { tr } from 'date-fns/locale';

const ISTANBUL_TZ = 'Europe/Istanbul';

/**
 * Format date to Turkish timezone
 */
export function formatTR(date: Date | string, formatStr: string = 'dd.MM.yyyy HH:mm'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, ISTANBUL_TZ, formatStr, { locale: tr });
}

/**
 * Get current date in Turkish timezone
 */
export function nowTR(): Date {
  return toZonedTime(new Date(), ISTANBUL_TZ);
}

/**
 * Convert any date to Turkish timezone
 */
export function toTR(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(dateObj, ISTANBUL_TZ);
}

/**
 * Convert datetime-local input value to ISO string (for database)
 * Input: "2024-12-05T20:00" (local Turkish time)
 * Output: ISO string in UTC for database storage
 */
export function localInputToISO(localDateTimeString: string): string {
  // datetime-local input gives us a string like "2024-12-05T20:00"
  // We need to treat this as Istanbul time and convert to UTC
  const date = new Date(localDateTimeString);
  // Manually adjust for Turkey timezone (UTC+3)
  const utcDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
  return utcDate.toISOString();
}

/**
 * Convert ISO date to datetime-local input value (Turkish timezone)
 * Input: ISO string from database
 * Output: "2024-12-05T20:00" (for datetime-local input)
 */
export function isoToLocalInput(isoString: string): string {
  const date = new Date(isoString);
  // Add Turkey timezone offset (UTC+3)
  const localDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
  // Format for datetime-local input: "YYYY-MM-DDTHH:mm"
  return localDate.toISOString().slice(0, 16);
}

/**
 * Get current Turkish time for datetime-local input default value
 */
export function nowTRForInput(): string {
  const now = new Date();
  // Add Turkey timezone offset (UTC+3)
  const localDate = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  return localDate.toISOString().slice(0, 16);
}
