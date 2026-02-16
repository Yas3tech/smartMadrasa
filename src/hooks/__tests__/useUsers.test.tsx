import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUsers } from '../useUsers';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

// Mock the modules
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/DataContext', () => ({
  useData: vi.fn(),
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock xlsx
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
    aoa_to_sheet: vi.fn(),
    book_new: vi.fn(),
    book_append_sheet: vi.fn(),
    sheet_add_json: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('useUsers', () => {
  const mockUsers = [
    { id: 'u1', name: 'User 1', email: 'u1@example.com', role: 'student' },
    { id: 'u2', name: 'User 2', email: 'u2@example.com', role: 'teacher' },
    { id: 'u3', name: 'User 3', email: 'u3@example.com', role: 'parent' },
    { id: 'u4', name: 'User 4', email: 'u4@example.com', role: 'director' },
    { id: 'u5', name: 'User 5', email: 'u5@example.com', role: 'superadmin' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { role: 'director' } } as ReturnType<typeof useAuth>);
    vi.mocked(useData).mockReturnValue({
      users: mockUsers,
      addUser: vi.fn(),
      updateUser: vi.fn(),
    });
  });

  it('should filter users correctly based on role', () => {
    const { result } = renderHook(() => useUsers());

    act(() => {
      result.current.setFilterRole('student');
    });

    expect(result.current.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].role).toBe('student');

    act(() => {
      result.current.setFilterRole('all');
    });
    // Director sees all except superadmin (if not superadmin)
    // mockUsers has 5 users. 1 is superadmin.
    // So 4 users visible.
    expect(result.current.filteredUsers).toHaveLength(4);
  });

  it('should filter users by search query', () => {
    const { result } = renderHook(() => useUsers());

    act(() => {
      result.current.setSearchQuery('User 2');
    });

    expect(result.current.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].name).toBe('User 2');
  });

  it('should calculate role counts correctly', () => {
    const { result } = renderHook(() => useUsers());

    expect(result.current.roleCounts.student).toBe(1);
    expect(result.current.roleCounts.teacher).toBe(1);
    expect(result.current.roleCounts.all).toBe(4); // Excluding superadmin
  });

  it('should memoize filteredUsers when unrelated state changes', () => {
    const { result } = renderHook(() => useUsers());

    const initialUsers = result.current.filteredUsers;
    const initialCounts = result.current.roleCounts;

    // Change unrelated state (modal open)
    act(() => {
      result.current.setIsModalOpen(true);
    });

    // Verify memoization (should be stable reference)
    expect(result.current.filteredUsers).toBe(initialUsers);
    expect(result.current.roleCounts).toBe(initialCounts);
  });
});
