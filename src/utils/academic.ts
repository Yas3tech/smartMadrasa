import type { AcademicPeriod } from '../types/bulletin';

/**
 * Determines the relevant academic period IDs for the current context.
 * Typically returns all period IDs for the current or most recent academic year.
 *
 * @param periods List of all academic periods
 * @returns Array of period IDs relevant for the current time
 */
export const getRelevantPeriodIds = (periods: AcademicPeriod[]): string[] => {
  if (!periods || periods.length === 0) return [];

  const now = new Date();

  // 1. Try to find the period that currently encompasses today
  let targetPeriod = periods.find((p) => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  });

  // 2. If no current period found (e.g. summer break), use the period with the latest end date
  if (!targetPeriod) {
    // Sort periods by endDate descending to find the latest one
    // We clone the array to avoid mutating the input
    const sortedPeriods = [...periods].sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    );
    targetPeriod = sortedPeriods[0];
  }

  if (!targetPeriod) return [];

  // 3. Return all period IDs that belong to the same academic year as the target period
  return periods.filter((p) => p.academicYear === targetPeriod!.academicYear).map((p) => p.id);
};
