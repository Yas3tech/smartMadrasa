import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  processNonParentUsers,
  processParentUsers,
  ImportedUserSummary,
  parseUserFile,
  UserImportRow,
} from './userImport';
import { User, Parent } from '../types';

// Mock exceljs
vi.mock('exceljs', () => {
  const mockWorkbook = {
    xlsx: {
      load: vi.fn().mockResolvedValue(undefined),
    },
    worksheets: [
      {
        eachRow: vi.fn((cb: (row: { eachCell: (fn: (cell: { value: string }, col: number) => void) => void }, rowNumber: number) => void) => {
          // Header row
          const headerRow = {
            eachCell: (fn: (cell: { value: string }, col: number) => void) => {
              fn({ value: 'name' }, 1);
              fn({ value: 'email' }, 2);
              fn({ value: 'role' }, 3);
            },
          };
          cb(headerRow, 1);
          // Data row
          const dataRow = {
            eachCell: (fn: (cell: { value: string }, col: number) => void) => {
              fn({ value: 'Test' }, 1);
              fn({ value: 'test@example.com' }, 2);
              fn({ value: 'student' }, 3);
            },
          };
          cb(dataRow, 2);
        }),
      },
    ],
  };
  return {
    default: {
      // Must use 'function' (not arrow) so it can be called with 'new'
      Workbook: vi.fn(function () { return mockWorkbook; }),
    },
  };
});

describe('userImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseUserFile', () => {
    it('should parse file correctly', async () => {
      const mockFile = new File([''], 'test.xlsx');
      mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

      const result = await parseUserFile(mockFile);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test');
      expect(result[0].email).toBe('test@example.com');
      expect(result[0].role).toBe('student');
    });
  });

  describe('processNonParentUsers', () => {
    it('should import non-parent users', async () => {
      const mockData: UserImportRow[] = [
        { name: 'Student 1', email: 's1@example.com', role: 'student' },
        { name: 'Teacher 1', email: 't1@example.com', role: 'teacher' },
        { name: 'Parent 1', email: 'p1@example.com', role: 'parent' }, // Should be skipped
      ];
      const addUser = vi.fn();

      const result = await processNonParentUsers(mockData, addUser);

      expect(addUser).toHaveBeenCalledTimes(2);
      expect(result.count).toBe(2);
      expect(result.importedUsers).toHaveLength(2);
      expect(result.importedUsers[0].email).toBe('s1@example.com');
      expect(result.importedUsers[1].email).toBe('t1@example.com');
    });

    it('should skip users with invalid roles', async () => {
      const mockData: UserImportRow[] = [
        { name: 'Student 1', email: 's1@example.com', role: 'invalid_role' },
        { name: 'Teacher 1', email: 't1@example.com', role: 'unknown' },
        { name: 'Admin 1', email: 'a1@example.com', role: 'superadmin' },
      ];
      const addUser = vi.fn();

      const result = await processNonParentUsers(mockData, addUser);

      expect(addUser).toHaveBeenCalledTimes(1);
      expect(result.count).toBe(1);
      expect(result.importedUsers[0].email).toBe('a1@example.com');
      expect(result.importedUsers[0].role).toBe('superadmin');
    });
  });

  describe('processParentUsers', () => {
    it('should import parent users and link to existing students', async () => {
      const mockData: UserImportRow[] = [
        {
          name: 'Parent 1',
          email: 'p1@example.com',
          role: 'parent',
          studentEmail: 's1@example.com',
        },
      ];
      const existingUsers = [{ id: 'u1', email: 's1@example.com', role: 'student' } as User];
      const importedUsers: ImportedUserSummary[] = [];
      const addUser = vi.fn();

      const count = await processParentUsers(mockData, existingUsers, importedUsers, addUser);

      expect(addUser).toHaveBeenCalledTimes(1);
      expect(count).toBe(1);

      const addedUser = addUser.mock.calls[0][0] as Parent;
      expect(addedUser.role).toBe('parent');
      expect(addedUser.childrenIds).toEqual(['u1']);
    });

    it('should import parent users and link to imported students', async () => {
      const mockData: UserImportRow[] = [
        {
          name: 'Parent 1',
          email: 'p1@example.com',
          role: 'parent',
          studentEmail: 's2@example.com',
        },
      ];
      const existingUsers: User[] = [];
      const importedUsers: ImportedUserSummary[] = [
        { id: 'u2', email: 's2@example.com', role: 'student' },
      ];
      const addUser = vi.fn();

      const count = await processParentUsers(mockData, existingUsers, importedUsers, addUser);

      expect(addUser).toHaveBeenCalledTimes(1);
      expect(count).toBe(1);

      const addedUser = addUser.mock.calls[0][0] as Parent;
      expect(addedUser.role).toBe('parent');
      expect(addedUser.childrenIds).toEqual(['u2']);
    });
  });
});
