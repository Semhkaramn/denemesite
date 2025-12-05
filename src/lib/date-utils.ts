import { format as dateFnsFormat } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
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
