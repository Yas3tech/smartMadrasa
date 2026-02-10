import { describe, it, expect } from 'vitest';
import { formatFirestoreTimestamp } from './date';

describe('formatFirestoreTimestamp', () => {
  it('should format a Firestore Timestamp-like object', () => {
    const mockTimestamp = {
      toDate: () => new Date('2023-01-01T12:00:00.000Z'),
    };
    expect(formatFirestoreTimestamp(mockTimestamp)).toBe('2023-01-01T12:00:00.000Z');
  });

  it('should return the original string if input is a string', () => {
    const dateString = '2023-01-01T12:00:00.000Z';
    expect(formatFirestoreTimestamp(dateString)).toBe(dateString);
  });

  it('should return undefined if input is undefined', () => {
    expect(formatFirestoreTimestamp(undefined)).toBeUndefined();
  });

  it('should return null if input is null', () => {
    expect(formatFirestoreTimestamp(null)).toBeNull();
  });

  it('should handle objects without toDate method', () => {
      const obj = { foo: 'bar' };
      expect(formatFirestoreTimestamp(obj)).toBe(obj);
  });
});
