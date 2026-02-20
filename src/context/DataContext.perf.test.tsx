import { render, act } from '@testing-library/react';
import { DataProvider, useData, useUsers } from './DataContext';
import { vi, describe, it, expect, afterEach } from 'vitest';
import * as AuthContext from './AuthContext';
import { memo } from 'react';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.spyOn(AuthContext, 'useAuth').mockImplementation(mockUseAuth);

const { triggerMessages, subscribe } = vi.hoisted(() => {
  const callbacks: Set<(msgs: any[]) => void> = new Set();
  return {
    triggerMessages: (msgs: any[]) => {
      callbacks.forEach((cb) => cb(msgs));
    },
    subscribe: (cb: any) => {
      callbacks.add(cb);
      return () => callbacks.delete(cb);
    },
  };
});

// Mock services to avoid errors during render
vi.mock('../services/users', () => ({
  subscribeToUsers: vi.fn(() => () => {}),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUserWithAllData: vi.fn(),
  getUserById: vi.fn(),
}));
vi.mock('../services/classes', () => ({
  subscribeToClasses: vi.fn(() => () => {}),
  createClass: vi.fn(),
  updateClass: vi.fn(),
  deleteClass: vi.fn(),
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
vi.mock('../services/messages', () => ({
  subscribeToMessages: vi.fn((cb) => {
    // Trigger initial empty
    cb([]);
    return subscribe(cb);
  }),
  sendMessage: vi.fn(),
  deleteMessage: vi.fn(),
  markMessageAsRead: vi.fn(),
  updateMessage: vi.fn(),
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

    expect(renderCount).toBe(2);
  });

  it('verifies that useData triggers re-renders on unrelated updates', async () => {
    const initialUser = { id: '1', role: 'admin', name: 'Admin' };
    mockUseAuth.mockReturnValue({ user: initialUser });

    let renderCount = 0;

    const ComponentUsingUseData = memo(() => {
      const { users } = useData(); // Only accessing users
      renderCount++;
      return <div>Users: {users.length}</div>;
    });

    render(
      <DataProvider>
        <ComponentUsingUseData />
      </DataProvider>
    );

    // Allow initial effects to settle
    await act(async () => {});

    const baselineRenders = renderCount;
    // Should be 1 (mount) + maybe 1 (loading false)
    console.log(`Baseline renders: ${baselineRenders}`);

    // Trigger message update
    await act(async () => {
      triggerMessages([
        {
          id: 'msg1',
          content: 'New Message',
          senderId: '2',
          receiverId: '1',
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    // useData returns a new object because messages changed
    // So ComponentUsingUseData re-renders
    const afterUpdateRenders = renderCount;
    console.log(`After update renders: ${afterUpdateRenders}`);

    expect(afterUpdateRenders).toBeGreaterThan(baselineRenders);
  });

  it('verifies that useUsers DOES NOT trigger re-renders on message updates', async () => {
    const initialUser = { id: '1', role: 'admin', name: 'Admin' };
    mockUseAuth.mockReturnValue({ user: initialUser });

    let renderCount = 0;

    const ComponentUsingUseUsers = memo(() => {
      const { users } = useUsers();
      renderCount++;
      return <div>Users: {users.length}</div>;
    });

    render(
      <DataProvider>
        <ComponentUsingUseUsers />
      </DataProvider>
    );

    // Allow initial effects to settle
    await act(async () => {});

    const baselineRenders = renderCount;
    console.log(`Baseline renders (useUsers): ${baselineRenders}`);

    // Trigger message update
    await act(async () => {
      triggerMessages([
        {
          id: 'msg2',
          content: 'Another Message',
          senderId: '2',
          receiverId: '1',
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    const afterUpdateRenders = renderCount;
    console.log(`After update renders (useUsers): ${afterUpdateRenders}`);

    // Should stay the same
    expect(afterUpdateRenders).toBe(baselineRenders);
  });
});
