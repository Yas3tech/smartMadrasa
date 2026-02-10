/**
 * Normalizes a Firestore timestamp or date string to an ISO string.
 * This handles cases where the date might be a Firestore Timestamp object,
 * a JavaScript Date object, or already a string.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeDate = (date: any): any => {
  return date?.toDate?.()?.toISOString() || date;
};
