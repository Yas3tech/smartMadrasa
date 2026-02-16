import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboard } from '../useDashboard';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

// Mock the modules
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/DataContext', () => ({
  useData: vi.fn(),
}));

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return dashboard data correctly', () => {
    // Setup mock data
    const mockUser = { id: 'user1', role: 'director', name: 'Director' };
    const mockStudents = [{ id: 's1', name: 'Student 1', role: 'student' }, { id: 's2', name: 'Student 2', role: 'student' }];
    const mockTeachers = [{ id: 't1', role: 'teacher', name: 'Teacher 1' }];
    const mockAttendance = [
      { date: new Date().toISOString().split('T')[0], status: 'present' },
      { date: new Date().toISOString().split('T')[0], status: 'absent' },
    ];
    const mockGrades = [
      { id: 'g1', score: 90, maxScore: 100, subject: 'Math', studentId: 's1' },
      { id: 'g2', score: 80, maxScore: 100, subject: 'Math', studentId: 's1' },
    ];

    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as ReturnType<typeof useAuth>);
    vi.mocked(useData).mockReturnValue({
      students: mockStudents,
      users: [...mockTeachers, ...mockStudents],
      grades: mockGrades,
      attendance: mockAttendance,
      messages: [],
      events: [],
      homeworks: [],
      classes: [],
    });

    const { result } = renderHook(() => useDashboard());

    const dash = result.current;

    // Verify basic data access
    expect(dash.students).toHaveLength(2);
    expect(dash.teachers).toHaveLength(1);

    // Check calculated stats
    // presentCount should be 1
    // attendanceRate: 1 present / 2 students * 100 = 50%
    // Wait, useDashboard calculates: presentCount = todayAttendance.filter(present).length
    // attendanceRate = students.length > 0 ? ((presentCount / students.length) * 100).toFixed(0) : 0
    // So 1 / 2 * 100 = 50.

    expect(dash.presentCount).toBe(1);
    expect(dash.attendanceRate).toBe("50");

    // Check memoization/data structure
    if (typeof dash.getWeeklyAttendanceData === 'function') {
      const data = dash.getWeeklyAttendanceData();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(7);
    } else {
      expect(Array.isArray(dash.weeklyAttendanceData)).toBe(true);
      expect(dash.weeklyAttendanceData).toHaveLength(7);
    }
  });
});
