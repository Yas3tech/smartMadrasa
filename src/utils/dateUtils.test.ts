import { describe, it, expect, vi } from 'vitest';
import { formatFirestoreTimestamp } from './dateUtils';

describe('formatFirestoreTimestamp', () => {
  it('should return undefined if value is undefined', () => {
    expect(formatFirestoreTimestamp(undefined)).toBeUndefined();
  });

  it('should return null if value is null', () => {
    expect(formatFirestoreTimestamp(null)).toBeNull();
  });

  it('should return the string if value is a string', () => {
    const dateStr = '2023-01-01T00:00:00.000Z';
    expect(formatFirestoreTimestamp(dateStr)).toBe(dateStr);
  });

  it('should return ISO string if value has toDate method', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const timestampMock = {
      toDate: vi.fn(() => date),
    };
    expect(formatFirestoreTimestamp(timestampMock)).toBe(date.toISOString());
    expect(timestampMock.toDate).toHaveBeenCalled();
  });

  it('should return original value if value does not have toDate method', () => {
    const value = 12345;
    expect(formatFirestoreTimestamp(value)).toBe(value);
  });

  it('should return original value if toDate exists but is not a function', () => {
    const value = { toDate: 'not a function' };
    expect(formatFirestoreTimestamp(value)).toBe(value);
  });

  it('should return original value if toDate returns something without toISOString', () => {
    const timestampMock = {
      toDate: vi.fn(() => null),
    };
    // @ts-ignore - simulating runtime behavior where toDate returns null
    expect(formatFirestoreTimestamp(timestampMock)).toBe(timestampMock);
  });
});
