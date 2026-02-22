import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGradeStats } from '../useGradeStats';
import { useData, usePerformance } from '../../context/DataContext';

// Mock the modules
vi.mock('../../context/DataContext', () => ({
  useData: vi.fn(),
  usePerformance: vi.fn(),
}));

describe('useGradeStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate student stats correctly', () => {
    // Setup mock data
    const mockGrades = [
      { id: 'g1', score: 90, maxScore: 100, subject: 'Math', studentId: 's1', date: '2024-01-01' },
      { id: 'g2', score: 80, maxScore: 100, subject: 'Math', studentId: 's1', date: '2024-01-02' },
      { id: 'g3', score: 70, maxScore: 100, subject: 'History', studentId: 's1', date: '2024-01-03' },
    ];
    const mockAttendance = [
      { id: 'a1', studentId: 's1', status: 'present', date: '2024-01-01' },
      { id: 'a2', studentId: 's1', status: 'absent', date: '2024-01-02' },
    ];

    const mockData = {
      grades: mockGrades,
      attendance: mockAttendance,
    };

    // Mock both contexts to support refactoring
    vi.mocked(useData).mockReturnValue(mockData as any);
    vi.mocked(usePerformance).mockReturnValue(mockData as any);

    const { result } = renderHook(() => useGradeStats());

    const { calculateStudentStats } = result.current;
    const stats = calculateStudentStats('s1');

    // Verify averages
    // Math: (90+80)/2 = 85
    // History: 70
    // Total: (90+80+70)/300 * 100 = 80
    expect(stats.avgGrade).toBe(80);

    // Verify attendance
    // 1 present, 1 absent = 50%
    expect(stats.attendanceRate).toBe(50);
    expect(stats.totalGrades).toBe(3);

    // Verify subject performance
    const mathStats = stats.subjectPerformance.find((s) => s.subject === 'Math');
    expect(mathStats?.average).toBe(85);
    expect(mathStats?.count).toBe(2);
  });

  it('should return memoized stats when studentId is provided', () => {
    // Setup mock data
    const mockGrades = [
      { id: 'g1', score: 90, maxScore: 100, subject: 'Math', studentId: 's1', date: '2024-01-01' },
    ];
    const mockAttendance = [
      { id: 'a1', studentId: 's1', status: 'present', date: '2024-01-01' },
    ];

    const mockData = {
      grades: mockGrades,
      attendance: mockAttendance,
    };

    vi.mocked(useData).mockReturnValue(mockData as any);
    vi.mocked(usePerformance).mockReturnValue(mockData as any);

    const { result } = renderHook(() => useGradeStats('s1'));

    const { stats, studentGrades } = result.current;

    expect(stats).not.toBeNull();
    expect(stats?.avgGrade).toBe(90);
    expect(stats?.attendanceRate).toBe(100);
    expect(studentGrades).toHaveLength(1);
    expect(studentGrades[0].id).toBe('g1');
  });
});
