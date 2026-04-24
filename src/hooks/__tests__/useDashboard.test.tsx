import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboard } from '../useDashboard';
import { useAuth } from '../../context/AuthContext';
import { useUsers, useAcademics, useCommunication, usePerformance } from '../../context/DataContext';

// Mock the modules
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/DataContext', () => ({
  useUsers: vi.fn(),
  useAcademics: vi.fn(),
  useCommunication: vi.fn(),
  usePerformance: vi.fn(),
}));

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return dashboard data correctly', () => {
    // Setup mock data
    const mockUser = { id: 'user1', role: 'director', name: 'Director' };
    const mockStudents = [
      { id: 's1', name: 'Student 1', role: 'student' },
      { id: 's2', name: 'Student 2', role: 'student' },
    ];
    const mockTeachers = [{ id: 't1', role: 'teacher', name: 'Teacher 1' }];
    const mockAttendance = [
      { date: new Date().toISOString().split('T')[0], status: 'present' },
      { date: new Date().toISOString().split('T')[0], status: 'absent' },
    ];
    const mockGrades = [
      { id: 'g1', score: 90, maxScore: 100, subject: 'Math', studentId: 's1' },
      { id: 'g2', score: 80, maxScore: 100, subject: 'Math', studentId: 's1' },
    ];

    vi.mocked(useAuth).mockReturnValue({ user: mockUser as unknown } as ReturnType<typeof useAuth>);
    vi.mocked(useUsers).mockReturnValue({
      students: mockStudents,
      users: [...mockTeachers, ...mockStudents],
    } as unknown);
    vi.mocked(useAcademics).mockReturnValue({
      classes: [],
    } as unknown);
    vi.mocked(useCommunication).mockReturnValue({
      messages: [],
      events: [],
    } as unknown);
    vi.mocked(usePerformance).mockReturnValue({
      grades: mockGrades,
      attendance: mockAttendance,
      homeworks: [],
    } as unknown);

    const { result } = renderHook(() => useDashboard());

    const dash = result.current;

    // Verify basic data access
    expect(dash.students).toHaveLength(2);
    expect(dash.teachers).toHaveLength(1);

    // Check calculated stats
    // presentCount should be 1
    // attendanceRate: 1 present / 2 students * 100 = 50%

    expect(dash.presentCount).toBe(1);
    expect(dash.attendanceRate).toBe('50');

    // Check memoization/data structure
    expect(Array.isArray(dash.weeklyAttendanceData)).toBe(true);
    expect(dash.weeklyAttendanceData).toHaveLength(7);
  });

  it('should calculate complex stats correctly', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const mockAttendance = [
      { date: todayStr, status: 'present' },
      { date: todayStr, status: 'present' },
      { date: todayStr, status: 'absent' },
      { date: yesterdayStr, status: 'present' },
    ] as unknown;

    const mockGrades = [
      { id: 'g1', score: 95, maxScore: 100, subject: 'Math', studentId: 's1' }, // Excellent
      { id: 'g2', score: 85, maxScore: 100, subject: 'Math', studentId: 's2' }, // Bien
      { id: 'g3', score: 55, maxScore: 100, subject: 'History', studentId: 's1' }, // Moyen
      { id: 'g4', score: 40, maxScore: 100, subject: 'History', studentId: 's2' }, // Faible
    ] as unknown;

    const mockUser = { id: 'user1', role: 'director', name: 'Director' };

    vi.mocked(useAuth).mockReturnValue({ user: mockUser as unknown } as ReturnType<typeof useAuth>);
    vi.mocked(useUsers).mockReturnValue({
      students: [],
      users: [],
    } as unknown);
    vi.mocked(useAcademics).mockReturnValue({
      classes: [],
    } as unknown);
    vi.mocked(useCommunication).mockReturnValue({
      messages: [],
      events: [],
    } as unknown);
    vi.mocked(usePerformance).mockReturnValue({
      grades: mockGrades,
      attendance: mockAttendance,
      homeworks: [],
    } as unknown);

    const { result } = renderHook(() => useDashboard());
    const dash = result.current;

    // Check weeklyAttendanceData
    // The last element is today, previous is yesterday
    const lastDay = dash.weeklyAttendanceData[6];
    const prevDay = dash.weeklyAttendanceData[5];

    expect(lastDay.présents).toBe(2);
    expect(lastDay.absents).toBe(1);
    expect(prevDay.présents).toBe(1);
    expect(prevDay.absents).toBe(0);

    // Check gradeDistributionData
    // Excellent: 1, Bien: 1, Moyen: 1, Faible: 1
    const excellent = dash.gradeDistributionData.find((d) => d.name.includes('Excellent'));
    const bien = dash.gradeDistributionData.find((d) => d.name.includes('Bien'));
    const moyen = dash.gradeDistributionData.find((d) => d.name.includes('Moyen'));
    const faible = dash.gradeDistributionData.find((d) => d.name.includes('Faible'));

    expect(excellent?.value).toBe(1);
    expect(bien?.value).toBe(1);
    expect(moyen?.value).toBe(1);
    expect(faible?.value).toBe(1);

    // Check subjectPerformanceData
    // Math: (95+85)/2 = 90
    // History: (55+40)/2 = 47.5 -> round to 48
    const math = dash.subjectPerformanceData.find((d) => d.subject === 'Math');
    const history = dash.subjectPerformanceData.find((d) => d.subject === 'History');

    expect(math?.moyenne).toBe(90);
    expect(history?.moyenne).toBe(48);
  });
});
