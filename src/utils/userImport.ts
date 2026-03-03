import ExcelJS from 'exceljs';
import type { User, Role, Parent } from '../types';

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
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows: UserImportRow[] = [];
  const headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // Header row — map column indices to field names
      row.eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || '').trim().toLowerCase();
      });
    } else {
      // Data rows
      const rowData: Record<string, string> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowData[header] = String(cell.value || '').trim();
        }
      });
      if (rowData.name && rowData.email && rowData.role) {
        rows.push({
          name: rowData.name,
          email: rowData.email,
          role: rowData.role,
          phone: rowData.phone,
          birthDate: rowData.birthdate || rowData.birthDate,
          studentEmail: rowData.studentemail || rowData.studentEmail,
        });
      }
    }
  });

  return rows;
};

export const processNonParentUsers = async (
  data: UserImportRow[],
  addUser: (user: User) => Promise<unknown>
): Promise<{ importedUsers: ImportedUserSummary[]; count: number }> => {
  const importedUsers: ImportedUserSummary[] = [];
  let importedCount = 0;

  for (const row of data) {
    if (row.name && row.email && row.role) {
      const roleNormalized = row.role.toLowerCase().trim();
      // SECURITY: Validate role — reject unknown roles to prevent invalid data
      const validRoles = ['student', 'teacher', 'parent', 'director', 'superadmin'];
      if (!validRoles.includes(roleNormalized)) continue;
      const validRole = roleNormalized as Role;
      if (validRole !== 'parent') {
        const newUser: User = {
          id: crypto.randomUUID(),
          name: row.name,
          email: row.email.toLowerCase().trim(),
          role: validRole,
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
          id: crypto.randomUUID(),
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
