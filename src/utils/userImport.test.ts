import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processNonParentUsers, processParentUsers, ImportedUserSummary, parseUserFile, UserImportRow } from './userImport';
import { User } from '../types';
import * as xlsx from 'xlsx';

// Mock xlsx
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

describe('userImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseUserFile', () => {
    it('should parse file correctly', async () => {
      const mockFile = new File([''], 'test.xlsx');
      const mockData = [{ name: 'Test' }];

      // Mock arrayBuffer
      mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

      // Mock xlsx functions
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };
      vi.mocked(xlsx.read).mockReturnValue(mockWorkbook as any);
      vi.mocked(xlsx.utils.sheet_to_json).mockReturnValue(mockData as any);

      const result = await parseUserFile(mockFile);

      expect(xlsx.read).toHaveBeenCalled();
      expect(xlsx.utils.sheet_to_json).toHaveBeenCalled();
      expect(result).toEqual(mockData);
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
  });

  describe('processParentUsers', () => {
    it('should import parent users and link to existing students', async () => {
      const mockData: UserImportRow[] = [
        { name: 'Parent 1', email: 'p1@example.com', role: 'parent', studentEmail: 's1@example.com' },
      ];
      const existingUsers = [
        { id: 'u1', email: 's1@example.com', role: 'student' } as User,
      ];
      const importedUsers: ImportedUserSummary[] = [];
      const addUser = vi.fn();

      const count = await processParentUsers(mockData, existingUsers, importedUsers, addUser);

      expect(addUser).toHaveBeenCalledTimes(1);
      expect(count).toBe(1);

      const addedUser = addUser.mock.calls[0][0] as any;
      expect(addedUser.role).toBe('parent');
      expect(addedUser.childrenIds).toEqual(['u1']);
    });

    it('should import parent users and link to imported students', async () => {
      const mockData: UserImportRow[] = [
        { name: 'Parent 1', email: 'p1@example.com', role: 'parent', studentEmail: 's2@example.com' },
      ];
      const existingUsers: User[] = [];
      const importedUsers: ImportedUserSummary[] = [
        { id: 'u2', email: 's2@example.com', role: 'student' },
      ];
      const addUser = vi.fn();

      const count = await processParentUsers(mockData, existingUsers, importedUsers, addUser);

      expect(addUser).toHaveBeenCalledTimes(1);
      expect(count).toBe(1);

      const addedUser = addUser.mock.calls[0][0] as any;
      expect(addedUser.role).toBe('parent');
      expect(addedUser.childrenIds).toEqual(['u2']);
    });
  });
});
