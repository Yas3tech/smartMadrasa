import { describe, it, expect } from 'vitest';
import { normalizeDate, formatFirestoreDate, formatFirestoreTimestamp } from './date';
import { Timestamp } from 'firebase/firestore';

describe('normalizeDate', () => {
  it('should return ISO string for Firestore Timestamp', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const timestamp = Timestamp.fromDate(date);
    expect(normalizeDate(timestamp)).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should return ISO string for object with toDate method', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const mockTimestamp = {
      toDate: () => date,
    };
    expect(normalizeDate(mockTimestamp)).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should return original value if input is string', () => {
    const dateStr = '2023-01-01T00:00:00.000Z';
    expect(normalizeDate(dateStr)).toBe(dateStr);
  });

  it('should return original value if input is null', () => {
    expect(normalizeDate(null)).toBeNull();
  });

  it('should return original value if input is undefined', () => {
    expect(normalizeDate(undefined)).toBeUndefined();
  });

  it('should return original value if input is number', () => {
    const num = 123456789;
    expect(normalizeDate(num)).toBe(num);
  });
});

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
  });
});

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
