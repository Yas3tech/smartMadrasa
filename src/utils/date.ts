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
};
