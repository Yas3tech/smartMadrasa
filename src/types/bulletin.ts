/**
 * Types for the Report Card (Bulletin) Management System
 */

/**
 * Academic Period (Trimester/Semester)
 */
export interface AcademicPeriod {
    id: string;
    name: string; // "Trimestre 1", "Semestre 1"
    academicYear: string; // "2024-2025"
    startDate: string; // ISO date
    endDate: string; // ISO date
    gradeEntryStartDate: string; // When teachers can start entering grades
    gradeEntryEndDate: string; // Deadline for grade entry
    bulletinPublishDate?: string; // When bulletins become available to students/parents
    isPublished: boolean; // Director has published the bulletins
    order: number; // 1, 2, 3 for ordering periods
}

/**
 * Grade Category (Test, Exam, Homework, etc.)
 */
export interface GradeCategory {
    id: string;
    name: string; // "Test", "Examen", "Devoir", "Compétence"
    code: string; // "TEST", "EXAM", "HW", "SKILL"
    weight: number; // Default coefficient (can be overridden per grade)
    color?: string; // For UI display
    description?: string;
}

/**
 * Course Grade (enriched grade with categories and periods)
 */
export interface CourseGrade {
    id: string;
    studentId: string;
    studentName?: string; // Denormalized
    courseId: string;
    courseName?: string; // Denormalized
    periodId: string;
    categoryId: string;
    categoryName?: string; // Denormalized
    title: string; // "Test Chapitre 3", "Examen Final"
    score: number;
    maxScore: number;
    date: string; // ISO date
    weight: number; // Coefficient for this specific grade
    comment?: string; // Optional comment for this grade
    teacherId: string;
    teacherName?: string; // Denormalized
}

/**
 * Teacher Comment (for a student in a course for a period)
 */
export interface TeacherComment {
    id: string;
    teacherId: string;
    teacherName?: string; // Denormalized
    studentId: string;
    studentName?: string; // Denormalized
    courseId: string;
    courseName?: string; // Denormalized
    periodId: string;
    periodName?: string; // Denormalized
    comment: string;
    isValidated: boolean; // Teacher has validated their grades for this course/period
    validationDate?: string; // ISO date
    createdAt: string;
    updatedAt: string;
}

/**
 * Report Card (Bulletin)
 */
export interface ReportCard {
    id: string;
    studentId: string;
    studentName?: string; // Denormalized
    classId: string;
    className?: string; // Denormalized
    periodId: string;
    periodName?: string; // Denormalized
    academicYear: string;

    // Calculated averages
    periodAverage: number; // Average for this period
    yearAverage: number; // Cumulative average for the year

    // Publication status
    isPublished: boolean;
    publishedAt?: string; // ISO date
    publishedBy?: string; // Director ID

    // Attendance stats
    absencesJustified: number;
    absencesUnjustified: number;
    lateCount: number;

    // Metadata
    generatedAt: string; // ISO date
    lastModified: string; // ISO date
}

/**
 * Course Average (for display in bulletin)
 */
export interface CourseAverage {
    courseId: string;
    courseName: string;
    teacherId: string;
    teacherName: string;
    periodAverage: number;
    yearAverage: number;
    gradeCount: number;
    comment?: string;
    isValidated: boolean;
}

/**
 * Bulletin Statistics (overall stats for a student)
 */
export interface BulletinStats {
    totalCourses: number;
    validatedCourses: number;
    periodAverage: number;
    yearAverage: number;
    rank?: number; // Class rank
    totalStudents?: number; // Total in class
}
