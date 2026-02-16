export const formatFirestoreDate = (date: unknown): string | unknown => {
  if (
    date &&
    typeof date === 'object' &&
    'toDate' in date &&
    typeof (date as { toDate: unknown }).toDate === 'function'
  ) {
    try {
      return (date as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return date;
    }
  }
  return date;
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Safely formats a Firestore Timestamp or Date-like object to an ISO string.
 * If the value is already a string or falsy, it returns the value as is.
 *
 * @param value - The value to format (Firestore Timestamp, Date, string, or null/undefined).
 * @returns The ISO string representation of the date, or the original value.
 */
export const formatFirestoreTimestamp = (value: any): any => {
  return value?.toDate?.()?.toISOString() || value;
};
