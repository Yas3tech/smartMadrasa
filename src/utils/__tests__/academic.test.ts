import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRelevantPeriodIds } from '../academic';
import type { AcademicPeriod } from '../../types/bulletin';

describe('getRelevantPeriodIds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty array if periods is empty', () => {
    expect(getRelevantPeriodIds([])).toEqual([]);
  });

  const periods: AcademicPeriod[] = [
    {
      id: 'p1',
      name: 'Semestre 1',
      academicYear: '2023-2024',
      startDate: '2023-09-01',
      endDate: '2024-01-31',
      type: 'semester',
    },
    {
      id: 'p2',
      name: 'Semestre 2',
      academicYear: '2023-2024',
      startDate: '2024-02-01',
      endDate: '2024-06-30',
      type: 'semester',
    },
    {
      id: 'p3',
      name: 'Semestre 1',
      academicYear: '2024-2025',
      startDate: '2024-09-01',
      endDate: '2025-01-31',
      type: 'semester',
    },
    {
      id: 'p4',
      name: 'Semestre 2',
      academicYear: '2024-2025',
      startDate: '2025-02-01',
      endDate: '2025-06-30',
      type: 'semester',
    },
  ];

  it('should return all period IDs for the current academic year if a period encompasses today', () => {
    // Current date is in Semestre 1 of 2024-2025
    vi.setSystemTime(new Date('2024-10-15'));
    const result = getRelevantPeriodIds(periods);
    expect(result).toEqual(['p3', 'p4']);
  });

  it('should return all period IDs for the current academic year if today is in Semestre 2', () => {
    // Current date is in Semestre 2 of 2023-2024
    vi.setSystemTime(new Date('2024-04-10'));
    const result = getRelevantPeriodIds(periods);
    expect(result).toEqual(['p1', 'p2']);
  });

  it('should fallback to the most recent period if today is not within any period (e.g. summer break)', () => {
    // Current date is summer break between 2024-2025 and 2025-2026
    // Latest period in the mock data is p4 (ends 2025-06-30)
    // Wait, let's say it's August 2025. Then targetPeriod will be p4, and year is 2024-2025.
    vi.setSystemTime(new Date('2025-08-15'));
    const result = getRelevantPeriodIds(periods);
    expect(result).toEqual(['p3', 'p4']);
  });

  it('should fallback to the most recent period even if today is in the past before the first period', () => {
    // If we're somehow before any period started, "latest end date" will still be chosen
    // which in this case is p4. This is an edge-case for the logic, but let's test its behavior.
    vi.setSystemTime(new Date('2022-01-01'));
    const result = getRelevantPeriodIds(periods);
    expect(result).toEqual(['p3', 'p4']);
  });
});
