import { describe, it, expect } from 'vitest';
import { formatFirestoreDate } from './date';

describe('formatFirestoreDate', () => {
  it('should format Firestore Timestamp to ISO string', () => {
    const mockTimestamp = {
      toDate: () => new Date('2023-01-01T12:00:00.000Z'),
    };
    expect(formatFirestoreDate(mockTimestamp)).toBe('2023-01-01T12:00:00.000Z');
  });

  it('should return the original value if it is not a Timestamp', () => {
    const dateString = '2023-01-01T12:00:00.000Z';
    expect(formatFirestoreDate(dateString)).toBe(dateString);
  });

  it('should return null if input is null', () => {
    expect(formatFirestoreDate(null)).toBeNull();
  });

  it('should return undefined if input is undefined', () => {
    expect(formatFirestoreDate(undefined)).toBeUndefined();
  });

  it('should handle complex object without toDate as original', () => {
      const obj = { some: 'value' };
      expect(formatFirestoreDate(obj)).toBe(obj);
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
