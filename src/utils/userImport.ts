import type { Role, Student, User } from '../types';

export interface ImportedUserSummary {
  id: string;
  email: string;
  role: string;
}

export interface UserImportRow {
  rowNumber: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  birthDate?: string;
  studentEmail?: string;
}

export type UserImportField =
  | 'name'
  | 'email'
  | 'role'
  | 'phone'
  | 'birthDate'
  | 'studentEmail';

export interface UserImportReviewRow extends UserImportRow {
  fieldErrors: Partial<Record<UserImportField, string>>;
  generalErrors: string[];
  isValid: boolean;
}

interface UserImportValidationOptions {
  existingUsers: User[];
  existingStudents: User[];
  canImportSuperadmin: boolean;
}

const VALID_ROLES: Role[] = ['student', 'teacher', 'parent', 'director', 'superadmin'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const IMPORT_FIELDS: UserImportField[] = [
  'name',
  'email',
  'role',
  'phone',
  'birthDate',
  'studentEmail',
];
const REQUIRED_IMPORT_HEADERS: UserImportField[] = ['name', 'email', 'role'];

const normalizeString = (value: unknown): string => String(value ?? '').trim();

const normalizeEmail = (value: string | undefined): string => normalizeString(value).toLowerCase();

const normalizeRole = (value: string | undefined): string => normalizeString(value).toLowerCase();

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const extractCellValue = (value: unknown): string => {
  if (value == null) return '';
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'object') {
    if ('text' in (value as Record<string, unknown>)) {
      return normalizeString((value as { text?: unknown }).text);
    }
    if ('result' in (value as Record<string, unknown>)) {
      return extractCellValue((value as { result?: unknown }).result);
    }
    if ('richText' in (value as Record<string, unknown>)) {
      const richText = (value as { richText?: Array<{ text?: string }> }).richText || [];
      return richText.map((part) => part.text || '').join('').trim();
    }
  }
  return normalizeString(value);
};

const mapRowToImportRow = (
  rowData: Partial<Record<UserImportField, string>>,
  rowNumber: number
): UserImportRow => ({
  rowNumber,
  name: normalizeString(rowData.name),
  email: normalizeEmail(rowData.email),
  role: normalizeRole(rowData.role),
  phone: normalizeString(rowData.phone),
  birthDate: normalizeString(rowData.birthDate),
  studentEmail: normalizeEmail(rowData.studentEmail),
});

const normalizeHeader = (header: string): string => header.trim().toLowerCase();

const mapHeaderToField = (header: string): UserImportField | null => {
  const normalizedHeader = normalizeHeader(header);
  if (normalizedHeader === 'birthdate') return 'birthDate';
  if (normalizedHeader === 'studentemail') return 'studentEmail';
  if (IMPORT_FIELDS.includes(normalizedHeader as UserImportField)) {
    return normalizedHeader as UserImportField;
  }
  return null;
};

const extractWorksheetHeaders = (
  worksheet: { getRow: (rowNumber: number) => { eachCell: (callback: (cell: { value: unknown }, columnNumber: number) => void) => void } }
): string[] => {
  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    headers[columnNumber] = normalizeHeader(extractCellValue(cell.value));
  });
  return headers.filter(Boolean);
};

export const scoreWorksheet = (
  worksheet: { name?: string; getRow: (rowNumber: number) => { eachCell: (callback: (cell: { value: unknown }, columnNumber: number) => void) => void } }
): number => {
  const headers = extractWorksheetHeaders(worksheet);
  const matchingHeaders = headers.filter((header) => mapHeaderToField(header) !== null).length;
  const hasRequiredHeaders = REQUIRED_IMPORT_HEADERS.every((requiredHeader) =>
    headers.includes(requiredHeader.toLowerCase())
  );
  const templateNameBonus = normalizeHeader(worksheet.name || '') === 'template' ? 100 : 0;
  const requiredHeadersBonus = hasRequiredHeaders ? 50 : 0;
  return templateNameBonus + requiredHeadersBonus + matchingHeaders;
};

const parseDelimitedLine = (line: string, delimiter: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const detectDelimiter = (headerLine: string): string => {
  const candidates = [';', ',', '\t'];
  let bestDelimiter = ',';
  let bestScore = 0;

  candidates.forEach((delimiter) => {
    const score = headerLine.split(delimiter).length;
    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  });

  return bestDelimiter;
};

const parseRowsFromText = (input: string): UserImportRow[] => {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseDelimitedLine(lines[0], delimiter).map((header) => header.toLowerCase());

  const rows: UserImportRow[] = [];

  for (let index = 1; index < lines.length; index++) {
    const values = parseDelimitedLine(lines[index], delimiter);
    const rowData: Partial<Record<UserImportField, string>> = {};

    headers.forEach((header, headerIndex) => {
      const value = values[headerIndex] || '';
      if (header === 'birthdate') rowData.birthDate = value;
      if (header === 'studentemail') rowData.studentEmail = value;
      if (IMPORT_FIELDS.includes(header as UserImportField)) {
        rowData[header as UserImportField] = value;
      }
    });

    const mapped = mapRowToImportRow(rowData, index + 1);
    if (IMPORT_FIELDS.some((field) => normalizeString(mapped[field]))) {
      rows.push(mapped);
    }
  }

  return rows;
};

const parseRowsFromWorkbook = async (file: File): Promise<UserImportRow[]> => {
  const ExcelJS = (await import('exceljs')).default;
  const data = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);

  const worksheet = [...workbook.worksheets]
    .sort((leftSheet, rightSheet) => scoreWorksheet(rightSheet) - scoreWorksheet(leftSheet))[0];
  if (!worksheet) return [];

  const headers: string[] = [];
  const rows: UserImportRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell, columnNumber) => {
        headers[columnNumber] = normalizeHeader(extractCellValue(cell.value));
      });
      return;
    }

    const rowData: Partial<Record<UserImportField, string>> = {};
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      const header = headers[columnNumber];
      const value = extractCellValue(cell.value);
      const mappedField = mapHeaderToField(header || '');
      if (mappedField) {
        rowData[mappedField] = value;
      }
    });

    const mapped = mapRowToImportRow(rowData, rowNumber);
    if (IMPORT_FIELDS.some((field) => normalizeString(mapped[field]))) {
      rows.push(mapped);
    }
  });

  return rows;
};

export const parseUserFile = async (file: File): Promise<UserImportRow[]> => {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.csv') || file.type.includes('csv') || file.type.startsWith('text/')) {
    return parseRowsFromText(await file.text());
  }
  return parseRowsFromWorkbook(file);
};

export const parseUserText = (input: string): UserImportRow[] => parseRowsFromText(input);

export const validateUserImportRows = (
  rows: UserImportRow[],
  options: UserImportValidationOptions
): UserImportReviewRow[] => {
  const existingEmails = new Set(options.existingUsers.map((user) => normalizeEmail(user.email)));
  const existingStudentEmails = new Set(
    options.existingStudents
      .filter((student) => student.role === 'student')
      .map((student) => normalizeEmail(student.email))
  );

  const normalizedRows = rows.map((row) => mapRowToImportRow(row, row.rowNumber));
  const studentEmailsInImport = new Set(
    normalizedRows
      .filter((row) => normalizeRole(row.role) === 'student' && EMAIL_REGEX.test(normalizeEmail(row.email)))
      .map((row) => normalizeEmail(row.email))
  );

  const emailCounts = normalizedRows.reduce<Record<string, number>>((acc, row) => {
    const email = normalizeEmail(row.email);
    if (!email) return acc;
    acc[email] = (acc[email] || 0) + 1;
    return acc;
  }, {});

  return normalizedRows.map((row) => {
    const fieldErrors: Partial<Record<UserImportField, string>> = {};
    const generalErrors: string[] = [];
    const role = normalizeRole(row.role);
    const email = normalizeEmail(row.email);
    const studentEmail = normalizeEmail(row.studentEmail);

    if (!row.name) fieldErrors.name = 'Nom requis';
    if (!email) {
      fieldErrors.email = 'Email requis';
    } else if (!EMAIL_REGEX.test(email)) {
      fieldErrors.email = 'Email invalide';
    } else {
      if (existingEmails.has(email)) fieldErrors.email = 'Email deja present';
      if ((emailCounts[email] || 0) > 1) fieldErrors.email = 'Email duplique dans le fichier';
    }

    if (!role) {
      fieldErrors.role = 'Role requis';
    } else if (!VALID_ROLES.includes(role as Role)) {
      fieldErrors.role = 'Role inconnu';
    } else if (role === 'superadmin' && !options.canImportSuperadmin) {
      fieldErrors.role = 'Seul un superadmin peut importer ce role';
    }

    if (row.birthDate && !DATE_REGEX.test(row.birthDate)) {
      fieldErrors.birthDate = 'Date attendue: YYYY-MM-DD';
    }

    if (studentEmail && role !== 'parent') {
      fieldErrors.studentEmail = 'Champ reserve aux parents';
    }

    if (role === 'parent') {
      if (!studentEmail) {
        fieldErrors.studentEmail = 'Email eleve requis pour un parent';
      } else if (!EMAIL_REGEX.test(studentEmail)) {
        fieldErrors.studentEmail = 'Email eleve invalide';
      } else if (!existingStudentEmails.has(studentEmail) && !studentEmailsInImport.has(studentEmail)) {
        fieldErrors.studentEmail = 'Eleve introuvable';
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      generalErrors.push('Corriger les champs en rouge avant import.');
    }

    return {
      ...row,
      email,
      role,
      studentEmail,
      fieldErrors,
      generalErrors,
      isValid: Object.keys(fieldErrors).length === 0,
    };
  });
};

export const getUserImportSummary = (rows: UserImportReviewRow[]) => {
  const validRows = rows.filter((row) => row.isValid);
  const invalidRows = rows.length - validRows.length;
  const roleCounts = rows.reduce<Record<string, number>>((acc, row) => {
    const key = normalizeRole(row.role) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    total: rows.length,
    valid: validRows.length,
    invalid: invalidRows,
    roleCounts,
  };
};

export const processNonParentUsers = async (
  data: UserImportRow[],
  addUser: (user: User) => Promise<unknown>
): Promise<{ importedUsers: ImportedUserSummary[]; count: number }> => {
  const importedUsers: ImportedUserSummary[] = [];
  let importedCount = 0;

  for (const row of data) {
    const role = normalizeRole(row.role) as Role;
    if (!VALID_ROLES.includes(role) || role === 'parent') continue;

    const newUser: User = {
      id: crypto.randomUUID(),
      name: normalizeString(row.name),
      email: normalizeEmail(row.email),
      role,
      phone: normalizeString(row.phone),
      birthDate: normalizeString(row.birthDate),
      avatar: normalizeString(row.name).charAt(0).toUpperCase(),
    };

    await addUser(newUser);
    importedUsers.push({ id: newUser.id, email: newUser.email, role: newUser.role });
    importedCount++;
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
    if (normalizeRole(row.role) !== 'parent') continue;

    const childrenIds: string[] = [];
    const relatedClassIds: string[] = [];
    const studentEmail = normalizeEmail(row.studentEmail);

    if (studentEmail) {
      const student = users.find(
        (user): user is Student => user.role === 'student' && normalizeEmail(user.email) === studentEmail
      );

      if (student) {
        childrenIds.push(student.id);
        if (student.classId) relatedClassIds.push(student.classId);
      } else {
        const imported = importedUsers.find(
          (user) => user.role === 'student' && normalizeEmail(user.email) === studentEmail
        );
        if (imported) childrenIds.push(imported.id);
      }
    }

    const newUser: any = {
      id: crypto.randomUUID(),
      name: normalizeString(row.name),
      email: normalizeEmail(row.email),
      role: 'parent',
      phone: normalizeString(row.phone),
      birthDate: normalizeString(row.birthDate),
      avatar: normalizeString(row.name).charAt(0).toUpperCase(),
      childrenIds,
    };
    if (relatedClassIds.length > 0) {
      newUser.relatedClassIds = relatedClassIds;
    }

    await addUser(newUser);
    importedCount++;
  }

  return importedCount;
};

export const importValidatedUserRows = async (
  rows: UserImportReviewRow[],
  users: User[],
  addUser: (user: User) => Promise<unknown>
): Promise<{ count: number }> => {
  const validRows = rows
    .filter((row) => row.isValid)
    .map((row) => ({
      rowNumber: row.rowNumber,
      name: row.name,
      email: row.email,
      role: row.role,
      phone: row.phone,
      birthDate: row.birthDate,
      studentEmail: row.studentEmail,
    }));

  const { importedUsers, count: nonParentCount } = await processNonParentUsers(validRows, addUser);
  const parentCount = await processParentUsers(validRows, users, importedUsers, addUser);
  return { count: nonParentCount + parentCount };
};
