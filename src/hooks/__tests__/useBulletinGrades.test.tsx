import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulletinGrades } from '../useBulletinGrades';
import { useAuth } from '../../context/AuthContext';
import { useData, useUsers, useAcademics, usePerformance } from '../../context';

// Mock the modules
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/DataContext', () => ({
  useData: vi.fn(),
  useUsers: vi.fn(),
  useAcademics: vi.fn(),
  usePerformance: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'fr' },
  }),
}));

vi.mock('../../services/teacherComments', () => ({
  subscribeToTeacherCommentsByStudent: vi.fn(() => () => {}),
  subscribeToTeacherCommentsByTeacher: vi.fn(() => () => {}),
}));

describe('useBulletinGrades', () => {
  const mockUser = { id: 't1', role: 'teacher', name: 'Teacher 1' };

  const mockStudents = [
    { id: 's1', name: 'Alice', role: 'student', classId: 'c1' },
    { id: 's2', name: 'Bob', role: 'student', classId: 'c1' },
  ];

  const mockClasses = [
    { id: 'c1', name: 'Class 1' },
    { id: 'c2', name: 'Class 2' },
  ];

  const mockCourses = [
    { id: 'course1', subject: 'Math', classId: 'c1', teacherId: 't1' },
    { id: 'course2', subject: 'Science', classId: 'c1', teacherId: 't1' },
  ];

  const mockGrades = [
    { id: 'g1', studentId: 's1', courseId: 'course1', score: 15, maxScore: 20, date: '2023-09-15' },
    { id: 'g2', studentId: 's1', courseId: 'course1', score: 18, maxScore: 20, date: '2023-10-15' },
  ];

  const mockPeriods = [{ id: 'p1', name: 'T1', startDate: '2023-09-01', endDate: '2023-12-31' }];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);

    // Mock granular hooks
    vi.mocked(useUsers).mockReturnValue({
      students: mockStudents,
    } as any);

    vi.mocked(useAcademics).mockReturnValue({
      classes: mockClasses,
      courses: mockCourses,
      academicPeriods: mockPeriods,
    } as any);

    vi.mocked(usePerformance).mockReturnValue({
      grades: mockGrades,
    } as any);
  });

  it('should initialize with correct data', () => {
    const { result } = renderHook(() => useBulletinGrades());
    expect(result.current.academicPeriods).toEqual(mockPeriods);
    // Teacher classes are derived from courses where teacherId matches user.id
    // t1 teaches course1 (c1) and course2 (c1). So c1 should be in teacherClasses.
    expect(result.current.teacherClasses).toHaveLength(1);
    expect(result.current.teacherClasses[0].id).toBe('c1');
  });

  it('should filter students when class is selected', () => {
    const { result } = renderHook(() => useBulletinGrades());

    act(() => {
      result.current.setSelectedClassId('c1');
    });

    expect(result.current.selectedClassId).toBe('c1');
    expect(result.current.classStudents).toHaveLength(2);
    expect(result.current.classStudents.map((s) => s.name)).toContain('Alice');
    expect(result.current.classStudents.map((s) => s.name)).toContain('Bob');
  });

  it('should calculate student averages correctly', () => {
    const { result } = renderHook(() => useBulletinGrades());

    act(() => {
      result.current.setSelectedClassId('c1');
      result.current.setSelectedPeriod('p1');
      result.current.setSelectedStudent('s1');
    });

    // s1 has 2 grades in course1: 15/20 and 18/20. Average = (15+18)/2 = 16.5
    // s1 has 0 grades in course2.
    // studentCourseAverages filters courses with grades > 0.

    expect(result.current.studentCourseAverages).toHaveLength(1);
    expect(result.current.studentCourseAverages[0].average).toBe(16.5);
    expect(result.current.studentCourseAverages[0].course.subject).toBe('Math');
  });
});
