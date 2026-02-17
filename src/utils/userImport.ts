import { read, utils } from 'xlsx';
import { User, Role, Parent } from '../types';

export interface ImportedUserSummary {
  id: string;
  email: string;
  role: string;
}

export interface UserImportRow {
  name: string;
  email: string;
  role: string;
  phone?: string;
  birthDate?: string;
  studentEmail?: string;
}

export const parseUserFile = async (file: File): Promise<UserImportRow[]> => {
  const data = await file.arrayBuffer();
  const workbook = read(data, { cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return utils.sheet_to_json<UserImportRow>(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });
};

export const processNonParentUsers = async (
  data: UserImportRow[],
  addUser: (user: User) => Promise<unknown>
): Promise<{ importedUsers: ImportedUserSummary[]; count: number }> => {
  const importedUsers: ImportedUserSummary[] = [];
  let importedCount = 0;

  for (const row of data) {
    if (row.name && row.email && row.role) {
      const roleNormalized = row.role.toLowerCase().trim() as Role;
      if (roleNormalized !== 'parent') {
        const newUser: User = {
          id: `u${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: row.name,
          email: row.email.toLowerCase().trim(),
          role: roleNormalized,
          phone: row.phone || '',
          birthDate: row.birthDate || '',
          avatar: row.name.charAt(0).toUpperCase(),
        };
        await addUser(newUser);
        importedUsers.push({ id: newUser.id, email: newUser.email, role: newUser.role });
        importedCount++;
      }
    }
  }
  return { importedUsers, count: importedCount };
};

export const processParentUsers = async (
  data: UserImportRow[],
  users: User[],
  importedUsers: ImportedUserSummary[],
  addUser: (user: User) => Promise<unknown>
): Promise<number> => {
  let importedCount = 0;

  for (const row of data) {
    if (row.name && row.email && row.role) {
      const roleNormalized = row.role.toLowerCase().trim();
      if (roleNormalized === 'parent') {
        const childrenIds: string[] = [];
        const relatedClassIds: string[] = [];

        if (row.studentEmail) {
          // Check existing users first
          const student = users.find((u) => u.email === row.studentEmail && u.role === 'student');
          // Then check just-imported users
          if (!student) {
            const imported = importedUsers.find(
              (u) => u.email === row.studentEmail && u.role === 'student'
            );
            if (imported) {
              childrenIds.push(imported.id);
            }
          } else {
            childrenIds.push(student.id);
            if ('classId' in student) {
              relatedClassIds.push((student as any).classId);
            }
          }
        }

        const newUser: Parent = {
          id: `u${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: row.name,
          email: row.email.toLowerCase().trim(),
          role: 'parent',
          phone: row.phone || '',
          birthDate: row.birthDate || '',
          avatar: row.name.charAt(0).toUpperCase(),
          childrenIds,
          relatedClassIds: relatedClassIds.length > 0 ? relatedClassIds : undefined,
        };

        await addUser(newUser);
        importedCount++;
      }
    }
  }
  return importedCount;
};
