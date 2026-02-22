import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHomework } from '../useHomework';
import { useAuth } from '../../context/AuthContext';
import { usePerformance } from '../../context/DataContext';
import { subscribeToSubmissions } from '../../services/homework';

// Mock dependencies
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/DataContext', () => ({
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

// Mock services
vi.mock('../../services/homework', () => ({
  createHomework: vi.fn(),
  updateHomework: vi.fn(),
  deleteHomework: vi.fn(),
  submitHomework: vi.fn(),
  updateSubmission: vi.fn(),
  subscribeToSubmissions: vi.fn(() => vi.fn()), // Return unsubscribe fn
  gradeSubmission: vi.fn(),
}));

vi.mock('../../services/storage', () => ({
  uploadFileWithProgress: vi.fn(),
  generateHomeworkPath: vi.fn(),
}));

describe('useHomework', () => {
  const mockHomeworks = [
    { id: 'h1', title: 'HW 1', classId: 'c1', dueDate: '2023-01-01', subject: 'Math', description: 'Desc' },
    { id: 'h2', title: 'HW 2', classId: 'c1', dueDate: '2023-01-02', subject: 'Math', description: 'Desc' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1', role: 'teacher', name: 'T1' } } as any);
    vi.mocked(usePerformance).mockReturnValue({
      homeworks: mockHomeworks,
    } as any);
  });

  it('should subscribe to submissions for student user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 's1', role: 'student', classId: 'c1', name: 'Student 1' }
    } as any);

    renderHook(() => useHomework());

    // Should call subscribeToSubmissions for each homework
    expect(subscribeToSubmissions).toHaveBeenCalledTimes(mockHomeworks.length);
    expect(subscribeToSubmissions).toHaveBeenCalledWith('h1', expect.any(Function));
    expect(subscribeToSubmissions).toHaveBeenCalledWith('h2', expect.any(Function));
  });

  it('should not subscribe to submissions for teacher user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 't1', role: 'teacher', name: 'Teacher 1' }
    } as any);

    renderHook(() => useHomework());

    expect(subscribeToSubmissions).not.toHaveBeenCalled();
  });
});
