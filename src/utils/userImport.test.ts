import { describe, expect, it } from 'vitest';
import { parseUserText, scoreWorksheet, validateUserImportRows } from './userImport';

describe('userImport', () => {
  it('parses pasted csv-like text into rows', () => {
    const rows = parseUserText(
      [
        'name,email,role,phone,birthDate,studentEmail',
        'Jean Dupont,jean@school.ma,student,,2010-01-01,',
        'Fatima Dupont,fatima@school.ma,parent,+212600000002,,jean@school.ma',
      ].join('\n')
    );

    expect(rows).toHaveLength(2);
    expect(rows[0].rowNumber).toBe(2);
    expect(rows[1].studentEmail).toBe('jean@school.ma');
  });

  it('flags parent rows that reference a missing student', () => {
    const reviewedRows = validateUserImportRows(
      [
        {
          rowNumber: 2,
          name: 'Fatima Dupont',
          email: 'fatima@school.ma',
          role: 'parent',
          phone: '',
          birthDate: '',
          studentEmail: 'missing@school.ma',
        },
      ],
      {
        existingUsers: [],
        existingStudents: [],
        canImportSuperadmin: false,
      }
    );

    expect(reviewedRows[0].isValid).toBe(false);
    expect(reviewedRows[0].fieldErrors.studentEmail).toContain('Eleve(s) introuvable(s): missing@school.ma');
  });

  it('validates multiple comma-separated student emails', () => {
    const reviewedRows = validateUserImportRows(
      [
        {
          rowNumber: 2,
          name: 'Fatima Dupont',
          email: 'fatima@school.ma',
          role: 'parent',
          phone: '',
          birthDate: '',
          studentEmail: 'child1@school.ma, child2@school.ma',
        },
      ],
      {
        existingUsers: [
          { id: '1', name: 'Child 1', email: 'child1@school.ma', role: 'student' } as any,
        ],
        existingStudents: [
          { id: '1', name: 'Child 1', email: 'child1@school.ma', role: 'student' } as any,
        ],
        canImportSuperadmin: false,
      }
    );

    expect(reviewedRows[0].isValid).toBe(false);
    expect(reviewedRows[0].fieldErrors.studentEmail).toContain('Eleve(s) introuvable(s): child2@school.ma');
  });

  it('rejects studentEmail for non-parent roles', () => {
    const reviewedRows = validateUserImportRows(
      [
        {
          rowNumber: 2,
          name: 'Jean Dupont',
          email: 'jean@school.ma',
          role: 'student',
          phone: '',
          birthDate: '2010-01-01',
          studentEmail: 'other@school.ma',
        },
      ],
      {
        existingUsers: [],
        existingStudents: [],
        canImportSuperadmin: false,
      }
    );

    expect(reviewedRows[0].isValid).toBe(false);
    expect(reviewedRows[0].fieldErrors.studentEmail).toBe('Champ reserve aux parents');
  });

  it('prefers the template worksheet over a guide worksheet', () => {
    const makeWorksheet = (name: string, headers: string[]) => ({
      name,
      getRow: () => ({
        eachCell: (callback: (cell: { value: unknown }, columnNumber: number) => void) => {
          headers.forEach((header, index) => callback({ value: header }, index + 1));
        },
      }),
    });

    const guideSheet = makeWorksheet('Guide', ['Section', 'Details']);
    const templateSheet = makeWorksheet('Template', [
      'name',
      'email',
      'role',
      'phone',
      'birthDate',
      'studentEmail',
    ]);

    expect(scoreWorksheet(templateSheet)).toBeGreaterThan(scoreWorksheet(guideSheet));
  });
});
