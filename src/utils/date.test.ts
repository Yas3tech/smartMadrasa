import { normalizeDate } from './date';
import { Timestamp } from 'firebase/firestore';
import { describe, it, expect } from 'vitest';

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
