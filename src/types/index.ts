export type Role = 'student' | 'parent' | 'teacher' | 'director' | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  birthDate?: string;
  mustChangePassword?: boolean;
}

export interface Student extends User {
  role: 'student';
  classId: string;
  className?: string; // Denormalized
  parentId: string;
}

export interface Parent extends User {
  role: 'parent';
  childrenIds: string[];
  children?: { id: string; name: string; classId: string; className?: string }[]; // Denormalized
}

export interface Teacher extends User {
  role: 'teacher';
  subjects: string[];
  classIds: string[];
  classes?: { id: string; name: string }[]; // Denormalized
}

export interface Director extends User {
  role: 'director';
}

export interface SuperAdmin extends User {
  role: 'superadmin';
}

export interface ClassGroup {
  id: string;
  name: string;
  grade: string;
  teacherId: string;
  teacherName?: string; // Denormalized
}

export interface Message {
  id: string | number;
  senderId: string | number;
  senderName: string;
  senderRole?: string;
  receiverId: string | number | 'group' | 'all';
  subject: string;
  content: string;
  read: boolean;
  archived?: boolean;
  timestamp: string;
  type?: 'individual' | 'broadcast' | 'group';
  attachments?: string[]; // URLs of attached files
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  type: 'lesson' | 'homework' | 'exam' | 'event' | 'evaluation';
  classId?: string;
  className?: string; // Denormalized
  courseId?: string; // Lien vers un cours spécifique de la classe
  attachments?: string[]; // URLs of attached files (for announcements/event details)
}
export interface Grade {
  id: string;
  studentId: string;
  studentName?: string; // Denormalized
  subject: string;
  score: number;
  maxScore: number;
  type: 'exam' | 'homework' | 'participation' | 'evaluation';
  title?: string; // Titre de l'évaluation (ex: "Examen chapitre 5", "Devoir maison #3")
  date: string;
  feedback?: string;
  courseId?: string; // Lien vers un cours spécifique
  className?: string; // Denormalized
  classId?: string;
  teacherId?: string;
  status?: 'present' | 'absent'; // Statut de présence
}

export interface Attendance {
  id: string;
  date: string;
  studentId: string;
  studentName?: string; // Denormalized
  status: 'present' | 'absent' | 'late';
  classId: string;
  courseId?: string; // Linked to a specific course session
  justification?: string; // Reason for absence/lateness
  isJustified?: boolean; // Whether the absence is justified
}

export interface Course {
  id: string;
  classId: string;
  className?: string; // Denormalized
  teacherId: string;
  teacherName?: string; // Denormalized
  subject: string;
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  startTime: string; // HH:mm format
  endTime: string;
  room?: string;
  isRecurring?: boolean;
  recurrenceStart?: string; // ISO date string
  recurrenceEnd?: string; // ISO date string
  weekOffset?: number;
  specificDate?: string;
  notes?: string;
  excludedDates?: string[]; // Dates to exclude from recurring course (ISO date strings)

  // Bulletin-related fields
  defaultCategories?: string[]; // IDs of default grade categories for this course
  isValidatedForPeriod?: Record<string, boolean>; // Map of periodId -> validation status
}

export interface SubmissionFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface Homework {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  assignedBy: string;
  classId: string;
  attachments?: string[];
  maxGrade?: number; // Optional now
  allowOnlineSubmission?: boolean; // New field
}

export interface Submission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content: string;
  files?: SubmissionFile[];
  grade?: number;
  feedback?: string;
}

// Export bulletin types
export * from './bulletin';
