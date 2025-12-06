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
  // We need to treat this as Istanbul time (UTC+3) and convert to UTC
  // Add timezone offset to make it a proper ISO string
  const istanbulDateString = localDateTimeString + ':00+03:00';
  const date = new Date(istanbulDateString);
  return date.toISOString();
}

/**
 * Convert ISO date to datetime-local input value (Turkish timezone)
 * Input: ISO string from database
 * Output: "2024-12-05T20:00" (for datetime-local input)
 */
export function isoToLocalInput(isoString: string): string {
  const date = new Date(isoString);
  // Format in Istanbul timezone
  return formatInTimeZone(date, ISTANBUL_TZ, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Get current Turkish time for datetime-local input default value
 */
export function nowTRForInput(): string {
  const now = new Date();
  // Format current time in Istanbul timezone for datetime-local input
  return formatInTimeZone(now, ISTANBUL_TZ, "yyyy-MM-dd'T'HH:mm");
}
