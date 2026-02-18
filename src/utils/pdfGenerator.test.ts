import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateStudentBulletinPDF, generateClassBulletinPDF } from './pdfGenerator';
import autoTable from 'jspdf-autotable';
import type { Student, AcademicPeriod, Course, Grade, TeacherComment } from '../types';
// BulletinData is not exported, so we infer it from the function signature
type BulletinData = Parameters<typeof generateStudentBulletinPDF>[0];

// Mock jsPDF
vi.mock('jspdf', () => {
  const jsPDFInstance = {
    text: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setFont: vi.fn(),
    line: vi.fn(),
    rect: vi.fn(),
    addPage: vi.fn(),
    setFillColor: vi.fn(),
    save: vi.fn(),
    lastAutoTable: { finalY: 100 },
  };
  return {
    jsPDF: vi.fn().mockImplementation(function () {
      return jsPDFInstance;
    }),
  };
});

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

describe('pdfGenerator', () => {
  const mockStudent: Student = {
    id: 'student1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'student',
    classId: 'class1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    photo: 'http://example.com/photo.jpg',
  };

  const mockPeriod: AcademicPeriod = {
    id: 'period1',
    name: 'Trimester 1',
    academicYear: '2023-2024',
    startDate: '2023-09-01',
    endDate: '2023-12-31',
    type: 'trimester',
  };

  const mockCourses: Course[] = [
    {
      id: 'course1',
      name: 'Math 101',
      subject: 'Mathematics',
      teacherId: 'teacher1',
      classId: 'class1',
      schedule: [],
    },
    {
      id: 'course2',
      name: 'History 101',
      subject: 'History',
      teacherId: 'teacher2',
      classId: 'class1',
      schedule: [],
    },
  ];

  const mockGrades: Grade[] = [
    {
      id: 'grade1',
      studentId: 'student1',
      courseId: 'course1',
      periodId: 'period1',
      score: 15,
      date: '2023-10-15',
      type: 'exam',
      coefficient: 1,
      createdAt: '2023-10-15',
      updatedAt: '2023-10-15',
      authorId: 'teacher1',
    },
    {
      id: 'grade2',
      studentId: 'student1',
      courseId: 'course2',
      periodId: 'period1',
      score: 18,
      date: '2023-11-20',
      type: 'exam',
      coefficient: 1,
      createdAt: '2023-11-20',
      updatedAt: '2023-11-20',
      authorId: 'teacher2',
    },
  ];

  const mockComments: TeacherComment[] = [
    {
      id: 'comment1',
      studentId: 'student1',
      courseId: 'course1',
      periodId: 'period1',
      comment: 'Good job',
      authorId: 'teacher1',
      createdAt: '2023-12-01',
      updatedAt: '2023-12-01',
    },
  ];

  const mockAbsences = {
    justified: 1,
    unjustified: 0,
    late: 2,
  };

  const mockData: BulletinData = {
    student: mockStudent,
    period: mockPeriod,
    courses: mockCourses,
    grades: mockGrades,
    comments: mockComments,
    absences: mockAbsences,
    className: 'Class A',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate student bulletin PDF', () => {
    const doc = generateStudentBulletinPDF(mockData);

    // Verify jsPDF constructor called
    // We can't easily check constructor call directly unless we import the mocked class
    // But we can check if methods on the returned doc (mock instance) were called.

    expect(doc.setFontSize).toHaveBeenCalledWith(22);
    expect(doc.text).toHaveBeenCalledWith('SMART MADRASSA', 105, 20, { align: 'center' });
    expect(doc.text).toHaveBeenCalledWith(`Élève : ${mockStudent.name}`, 20, 50);

    // Check autotable
    // The second argument to autoTable is the options object
    expect(autoTable).toHaveBeenCalled();
    const options = vi.mocked(autoTable).mock.calls[0][1];

    // Verify table data
    // Mathematics should have average 15
    // History should have average 18
    expect(options.body).toHaveLength(2);
    expect(options.body[0]).toContain('Mathematics');
    expect(options.body[0]).toContain('15.00 / 20');
    expect(options.body[1]).toContain('History');
    expect(options.body[1]).toContain('18.00 / 20');
  });

  it('should generate class bulletin PDF', () => {
    const dataList = [mockData, { ...mockData, student: { ...mockStudent, id: 'student2', name: 'Jane Doe' } }];
    const doc = generateClassBulletinPDF(dataList, 'Class A', 'Trimester 1');

    // Should call addPage for the second student
    expect(doc.addPage).toHaveBeenCalledTimes(1);

    // Should call text for both students
    expect(doc.text).toHaveBeenCalledWith(`Élève : ${mockStudent.name}`, 20, 50);
    expect(doc.text).toHaveBeenCalledWith('Élève : Jane Doe', 20, 50);

    // Should call autoTable twice
    expect(autoTable).toHaveBeenCalledTimes(2);
  });
});
