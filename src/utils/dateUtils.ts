/**
 * Formats a Firestore Timestamp or other value into an ISO date string if possible.
 * If the value has a `toDate` method, it is called, and the result is converted to an ISO string.
 * Otherwise, the original value is returned.
 *
 * @param value The value to format.
 * @returns The ISO date string or the original value.
 */
export const formatFirestoreTimestamp = (value: unknown): unknown => {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate()?.toISOString() || value;
  }
  return value;
};
