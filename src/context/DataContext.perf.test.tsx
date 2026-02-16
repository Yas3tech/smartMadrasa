import { render, act } from '@testing-library/react';
import { DataProvider, useData } from './DataContext';
import { vi, describe, it, expect, afterEach } from 'vitest';
import * as AuthContext from './AuthContext';
import { memo } from 'react';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.spyOn(AuthContext, 'useAuth').mockImplementation(mockUseAuth);

// Mock services to avoid errors during render
vi.mock('../services/users', () => ({
  subscribeToUsers: vi.fn(() => () => {}),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));
vi.mock('../services/classes', () => ({
  subscribeToClasses: vi.fn(() => () => {}),
  createClass: vi.fn(),
  updateClass: vi.fn(),
  deleteClass: vi.fn(),
}));
vi.mock('../services/messages', () => ({
  subscribeToMessages: vi.fn(() => () => {}),
  sendMessage: vi.fn(),
  deleteMessage: vi.fn(),
  markMessageAsRead: vi.fn(),
  updateMessage: vi.fn(),
}));
vi.mock('../services/events', () => ({
  subscribeToEvents: vi.fn(() => () => {}),
  subscribeToEventsByClassIds: vi.fn(() => () => {}),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));
vi.mock('../services/courseGrades', () => ({
  subscribeToCourseGrades: vi.fn(() => () => {}),
  subscribeToCourseGradesByStudentIds: vi.fn(() => () => {}),
  createCourseGrade: vi.fn(),
  updateCourseGrade: vi.fn(),
}));
vi.mock('../services/attendance', () => ({
  subscribeToAttendance: vi.fn(() => () => {}),
  subscribeToAttendanceByStudentIds: vi.fn(() => () => {}),
  createAttendance: vi.fn(),
  updateAttendance: vi.fn(),
}));
vi.mock('../services/courses', () => ({
  subscribeToCourses: vi.fn(() => () => {}),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
}));
vi.mock('../services/homework', () => ({
  subscribeToHomeworks: vi.fn(() => () => {}),
  subscribeToHomeworksByClassIds: vi.fn(() => () => {}),
  createHomework: vi.fn(),
  updateHomework: vi.fn(),
  deleteHomework: vi.fn(),
}));
vi.mock('../services/academicPeriods', () => ({
  subscribeToAcademicPeriods: vi.fn(() => () => {}),
  createAcademicPeriod: vi.fn(),
  updateAcademicPeriod: vi.fn(),
  deleteAcademicPeriod: vi.fn(),
  publishPeriodBulletins: vi.fn(),
}));
vi.mock('../services/gradeCategories', () => ({
  subscribeToGradeCategories: vi.fn(() => () => {}),
  createGradeCategory: vi.fn(),
  updateGradeCategory: vi.fn(),
  deleteGradeCategory: vi.fn(),
}));

// Mock config
vi.mock('../config/firebase', () => ({
  isFirebaseConfigured: true,
}));

describe('DataProvider Performance', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not re-render consumers when DataProvider re-renders but state remains same', () => {
    let renderCount = 0;

    const Consumer = memo(() => {
      useData(); // Consume context
      renderCount++;
      return <div>Consumer</div>;
    });

    // Initial user
    const initialUser = { id: '1', role: 'admin', name: 'Admin' };
    mockUseAuth.mockReturnValue({ user: initialUser });

    const { rerender } = render(
      <DataProvider>
        <Consumer />
      </DataProvider>
    );

    // Initial renders: 1 (mount) + 1 (isLoading false) = 2
    expect(renderCount).toBe(2);

    console.log('--- Triggering Parent Re-render ---');

    // Force re-render of DataProvider by re-rendering parent with same props
    rerender(
      <DataProvider>
        <Consumer />
      </DataProvider>
    );

    // If value is not memoized: Context changes -> Consumer renders => 3
    // If value IS memoized: Context same -> Consumer (memo) sees same props & same context -> NO render => 2

    expect(renderCount).toBe(2);
  });
});
