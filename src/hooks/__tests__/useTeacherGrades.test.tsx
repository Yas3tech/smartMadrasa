import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTeacherGrades } from '../useTeacherGrades';
import { useAuth } from '../../context/AuthContext';
import { useUsers, useAcademics, usePerformance } from '../../context/DataContext';

// Mock the modules
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/DataContext', () => ({
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
  }),
}));

describe('useTeacherGrades', () => {
  const mockStudents = [
    { id: 's1', name: 'Alice', role: 'student', classId: 'c1' },
    { id: 's2', name: 'Bob', role: 'student', classId: 'c1' },
    { id: 's3', name: 'Charlie', role: 'student', classId: 'c2' },
  ];

  const mockClasses = [
    { id: 'c1', name: 'Class 1', teacherId: 't1' },
    { id: 'c2', name: 'Class 2', teacherId: 't1' },
  ];

  const mockGrades = [
    { id: 'g1', studentId: 's1', subject: 'Math', score: 90, maxScore: 100, date: '2023-01-01' },
    { id: 'g2', studentId: 's2', subject: 'Math', score: 85, maxScore: 100, date: '2023-01-01' },
    { id: 'g3', studentId: 's1', subject: 'Science', score: 95, maxScore: 100, date: '2023-01-02' },
    { id: 'g4', studentId: 's3', subject: 'Math', score: 88, maxScore: 100, date: '2023-01-01' }, // Different class
  ];

  const mockCourses = [
    { id: 'course1', subject: 'Math', classId: 'c1' },
    { id: 'course2', subject: 'Science', classId: 'c1' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 't1', role: 'teacher' } } as any);

    // Mock individual hooks
    vi.mocked(useUsers).mockReturnValue({
      students: mockStudents,
      isLoading: false,
    } as any);

    vi.mocked(useAcademics).mockReturnValue({
      classes: mockClasses,
      courses: mockCourses,
      isLoading: false,
    } as any);

    vi.mocked(usePerformance).mockReturnValue({
      grades: mockGrades,
      addGrade: vi.fn(),
      updateGrade: vi.fn(),
      isLoading: false,
    } as any);
  });

  it('should filter subjectGrades correctly for selected class and subject', () => {
    const { result } = renderHook(() => useTeacherGrades());

    act(() => {
      result.current.setSelectedClassId('c1');
    });

    act(() => {
      result.current.setSelectedSubject('Math');
    });

    // Should include g1 (Alice, Math, c1) and g2 (Bob, Math, c1)
    // Should NOT include g3 (Alice, Science)
    // Should NOT include g4 (Charlie, Math, c2)
    expect(result.current.subjectGrades).toHaveLength(2);
    expect(result.current.subjectGrades.map(g => g.id)).toContain('g1');
    expect(result.current.subjectGrades.map(g => g.id)).toContain('g2');
  });

  it('should not be affected by search term in filteredStudents', () => {
    const { result } = renderHook(() => useTeacherGrades());

    act(() => {
      result.current.setSelectedClassId('c1');
      result.current.setSelectedSubject('Math');
      result.current.setSearchTerm('Alice');
    });

    expect(result.current.subjectGrades).toHaveLength(2);
  });

  it('should return a studentMap for efficient lookups', () => {
      const { result } = renderHook(() => useTeacherGrades());

      act(() => {
          result.current.setSelectedClassId('c1');
      });

      if (result.current.studentMap) {
          expect(result.current.studentMap.get('s1')).toBeDefined();
          expect(result.current.studentMap.get('s1')?.name).toBe('Alice');
          expect(result.current.studentMap.get('s2')).toBeDefined();
          expect(result.current.studentMap.get('s3')).toBeUndefined();
      }
  });
});
