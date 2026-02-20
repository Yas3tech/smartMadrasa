import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToTeacherCommentsByStudent,
  subscribeToTeacherCommentsByTeacher,
  createTeacherComment,
  validateTeacherComment,
  updateTeacherComment,
  batchCreateTeacherComments,
} from '../services/teacherComments';
import toast from 'react-hot-toast';
import type { TeacherComment } from '../types/bulletin';
import type { Student, Course, AcademicPeriod, Grade } from '../types';

export interface UseBulletinGradesReturn {
  // State
  selectedPeriod: string;
  setSelectedPeriod: (id: string) => void;
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedStudent: string;
  setSelectedStudent: (id: string) => void;
  comments: Record<string, string>;
  setComments: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  // Data
  academicPeriods: AcademicPeriod[];
  teacherClasses: { id: string; name: string; grade: string }[];
  classStudents: Student[];
  selectedPeriodData?: AcademicPeriod;
  selectedClassData?: { id: string; name: string };
  selectedStudentData?: Student;
  classValidationStats: { total: number; validated: number };
  studentCourseAverages: {
    course: Course;
    gradeCount: number;
    average: number;
    existingComment?: TeacherComment;
  }[];
  overallAverage: number;
  classComments: TeacherComment[];
  teacherComments: TeacherComment[];

  // Handlers
  handleSaveComment: (courseId: string) => Promise<void>;
  handleValidateAll: () => Promise<void>;
  handleValidateStudentBulletin: () => Promise<void>;
  isValidationAllowed: boolean;
}

export function useBulletinGrades(): UseBulletinGradesReturn {
  const { t, i18n } = useTranslation();
  const { academicPeriods, courses, students, grades, classes } = useData();
  const { user } = useAuth();
  const locale = i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'nl' ? 'nl-NL' : 'fr-FR';

  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [comments, setComments] = useState<Record<string, string>>({});
  const [teacherComments, setTeacherComments] = useState<TeacherComment[]>([]);
  const [classComments, setClassComments] = useState<TeacherComment[]>([]);

  useEffect(() => {
    if (selectedStudent) {
      const unsubscribe = subscribeToTeacherCommentsByStudent(
        selectedStudent,
        (fetchedComments) => {
          setTeacherComments(fetchedComments);
        }
      );
      return () => unsubscribe();
    } else {
      setTeacherComments([]);
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (selectedPeriod && user?.id) {
      const unsubscribe = subscribeToTeacherCommentsByTeacher(
        user.id,
        selectedPeriod,
        (fetchedComments) => {
          setClassComments(fetchedComments);
        }
      );
      return () => unsubscribe();
    }
  }, [selectedPeriod, user?.id]);

  const selectedPeriodData = academicPeriods.find((p) => p.id === selectedPeriod);
  const selectedClassData = classes.find((c) => c.id === selectedClassId);
  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  // Get classes that the teacher teaches
  const teacherClasses = useMemo(() => {
    if (!user?.id) return [];
    const teacherCourseClassIds = courses
      .filter((c) => c.teacherId === user.id)
      .map((c) => c.classId);
    const uniqueClassIds = Array.from(new Set(teacherCourseClassIds));
    return classes.filter((c) => uniqueClassIds.includes(c.id));
  }, [courses, classes, user?.id]);

  // Get students in the selected class
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => (s as Student).classId === selectedClassId);
  }, [selectedClassId, students]);

  const classValidationStats = useMemo(() => {
    if (!selectedClassId || !user?.id || !selectedPeriodData) return { total: 0, validated: 0 };

    const teacherCoursesInClass = courses.filter(
      (c) => c.teacherId === user.id && c.classId === selectedClassId
    );
    let total = 0;
    let validated = 0;

    const periodStart = new Date(selectedPeriodData.startDate);
    const periodEnd = new Date(selectedPeriodData.endDate);

    // Optimization: Create a Set of active student-course pairs with grades in this period
    // This reduces complexity from O(S * C * G) to O(G + S * C)
    const activeGradeKeys = new Set<string>();
    grades.forEach((g) => {
      const gDate = new Date(g.date);
      if (gDate >= periodStart && gDate <= periodEnd && g.courseId) {
        activeGradeKeys.add(`${g.studentId}::${g.courseId}`);
      }
    });

    classStudents.forEach((student) => {
      teacherCoursesInClass.forEach((course) => {
        const hasGrades = activeGradeKeys.has(`${student.id}::${course.id}`);

        if (hasGrades) {
          total++;
          const comment = classComments.find(
            (c) =>
              c.studentId === student.id &&
              c.courseId === course.id &&
              c.periodId === selectedPeriod
          );
          if (comment?.isValidated) {
            validated++;
          }
        }
      });
    });

    return { total, validated };
  }, [
    selectedClassId,
    classStudents,
    courses,
    user?.id,
    classComments,
    selectedPeriod,
    selectedPeriodData,
    grades,
  ]);

  const studentCourseAverages = useMemo(() => {
    if (!selectedStudent || !selectedPeriod || !selectedPeriodData || !user) return [];

    const teacherCourses = courses.filter((c) => c.teacherId === user.id);

    // Optimization: Filter grades once and group by course
    // Reduces complexity from O(C * G) to O(G + C)
    const periodStart = new Date(selectedPeriodData.startDate);
    const periodEnd = new Date(selectedPeriodData.endDate);

    const relevantGrades = grades.filter(
      (g) =>
        g.studentId === selectedStudent &&
        new Date(g.date) >= periodStart &&
        new Date(g.date) <= periodEnd
    );

    const gradesByCourse = new Map<string, Grade[]>();
    relevantGrades.forEach((g) => {
      if (!g.courseId) return;
      if (!gradesByCourse.has(g.courseId)) {
        gradesByCourse.set(g.courseId, []);
      }
      gradesByCourse.get(g.courseId)!.push(g);
    });

    return teacherCourses
      .map((course) => {
        const periodGrades = gradesByCourse.get(course.id) || [];

        let average = 0;
        if (periodGrades.length > 0) {
          const sum = periodGrades.reduce((acc, g) => acc + g.score, 0);
          average = sum / periodGrades.length;
        }

        const existingComment = teacherComments.find(
          (tc) =>
            tc.studentId === selectedStudent &&
            tc.courseId === course.id &&
            tc.periodId === selectedPeriod
        );

        return {
          course,
          gradeCount: periodGrades.length,
          average,
          existingComment,
        };
      })
      .filter((item) => item.gradeCount > 0);
  }, [selectedStudent, selectedPeriod, selectedPeriodData, courses, user, grades, teacherComments]);

  const overallAverage = useMemo(() => {
    if (studentCourseAverages.length === 0) return 0;
    const sum = studentCourseAverages.reduce((acc, item) => acc + item.average, 0);
    return sum / studentCourseAverages.length;
  }, [studentCourseAverages]);

  const isValidationAllowed = useMemo(() => {
    if (!selectedPeriodData) return false;
    const now = new Date();
    const startDate = new Date(selectedPeriodData.startDate);
    return now >= startDate;
  }, [selectedPeriodData]);

  const handleSaveComment = async (courseId: string) => {
    const commentText = comments[courseId];
    const course = courses.find((c) => c.id === courseId);
    const student = students.find((s) => s.id === selectedStudent);
    const period = academicPeriods.find((p) => p.id === selectedPeriod);

    if (!course || !student || !period || !user) return;

    const existingComment = teacherComments.find(
      (tc) =>
        tc.studentId === selectedStudent &&
        tc.courseId === courseId &&
        tc.periodId === selectedPeriod
    );

    try {
      if (existingComment) {
        if (commentText !== undefined && commentText !== existingComment.comment) {
          await updateTeacherComment(existingComment.id, {
            comment: commentText,
            isValidated: false,
          });
          toast.success(t('bulletinGrades.commentUpdated'));
        }
      } else {
        if (!commentText || !commentText.trim()) {
          toast.error(t('bulletinGrades.pleaseWriteComment'));
          return;
        }

        const comment: Omit<TeacherComment, 'id' | 'createdAt' | 'updatedAt'> = {
          teacherId: user.id,
          teacherName: user.name,
          studentId: selectedStudent,
          studentName: student.name,
          courseId: courseId,
          courseName: course.subject,
          periodId: selectedPeriod,
          periodName: period.name,
          comment: commentText,
          isValidated: false,
        };
        await createTeacherComment(comment);
        toast.success(t('bulletinGrades.commentSaved'));
      }
    } catch {
      toast.error(t('bulletinGrades.saveError'));
    }
  };

  const handleValidateAll = async () => {
    if (!selectedClassId || !user?.id || !selectedPeriod || !selectedPeriodData) return;

    if (!isValidationAllowed) {
      toast.error(
        t('bulletinGrades.validationNotOpen', {
          date: new Date(selectedPeriodData.startDate).toLocaleDateString(locale),
        })
      );
      return;
    }

    const teacherCoursesInClass = courses.filter(
      (c) => c.teacherId === user.id && c.classId === selectedClassId
    );
    const commentsToCreate: Omit<TeacherComment, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const commentsToUpdateIds: string[] = [];
    let count = 0;

    classStudents.forEach((student) => {
      teacherCoursesInClass.forEach((course) => {
        const comment = classComments.find(
          (c) =>
            c.studentId === student.id && c.courseId === course.id && c.periodId === selectedPeriod
        );

        if (comment) {
          if (!comment.isValidated) {
            commentsToUpdateIds.push(comment.id);
            count++;
          }
        } else {
          commentsToCreate.push({
            teacherId: user.id,
            teacherName: user.name,
            studentId: student.id,
            studentName: student.name,
            courseId: course.id,
            courseName: course.subject,
            periodId: selectedPeriod,
            periodName: selectedPeriodData.name,
            comment: '',
            isValidated: true,
          });
          count++;
        }
      });
    });

    if (count === 0) {
      toast.success(t('bulletinGrades.allValidated'));
      return;
    }

    if (confirm(t('bulletinGrades.confirmValidateAll', { count }))) {
      try {
        if (commentsToCreate.length > 0) {
          await batchCreateTeacherComments(commentsToCreate);
        }
        const updatePromises = commentsToUpdateIds.map((id) => validateTeacherComment(id));
        await Promise.all(updatePromises);
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.success(t('bulletinGrades.batchValidationSuccess'));
      } catch {
        toast.error(t('bulletinGrades.batchValidationError'));
      }
    }
  };

  const handleValidateStudentBulletin = async () => {
    if (!selectedStudent || !user?.id || !selectedPeriod || !selectedPeriodData) return;

    if (!isValidationAllowed) {
      toast.error(
        t('bulletinGrades.validationNotOpen', {
          date: new Date(selectedPeriodData.startDate).toLocaleDateString(locale),
        })
      );
      return;
    }

    const teacherCourses = courses.filter((c) => c.teacherId === user.id);
    const commentsToCreate: Omit<TeacherComment, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const commentsToUpdateIds: string[] = [];
    let count = 0;

    teacherCourses.forEach((course) => {
      const comment = teacherComments.find(
        (c) => c.courseId === course.id && c.periodId === selectedPeriod
      );

      if (comment) {
        if (!comment.isValidated) {
          commentsToUpdateIds.push(comment.id);
          count++;
        }
      } else {
        commentsToCreate.push({
          teacherId: user.id,
          teacherName: user.name,
          studentId: selectedStudent,
          studentName: selectedStudentData?.name || '',
          courseId: course.id,
          courseName: course.subject,
          periodId: selectedPeriod,
          periodName: selectedPeriodData.name,
          comment: '',
          isValidated: true,
        });
        count++;
      }
    });

    if (count === 0) {
      toast.success(t('bulletinGrades.bulletinAlreadyValidated'));
      return;
    }

    if (confirm(t('bulletinGrades.confirmValidateStudent', { name: selectedStudentData?.name }))) {
      try {
        if (commentsToCreate.length > 0) {
          await batchCreateTeacherComments(commentsToCreate);
        }
        const updatePromises = commentsToUpdateIds.map((id) => validateTeacherComment(id));
        await Promise.all(updatePromises);
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.success(t('bulletinGrades.bulletinValidated'));
      } catch {
        toast.error(t('bulletinGrades.validationError'));
      }
    }
  };

  return {
    selectedPeriod,
    setSelectedPeriod,
    selectedClassId,
    setSelectedClassId,
    selectedStudent,
    setSelectedStudent,
    comments,
    setComments,
    academicPeriods,
    teacherClasses,
    classStudents,
    selectedPeriodData,
    selectedClassData,
    selectedStudentData,
    classValidationStats,
    studentCourseAverages,
    overallAverage,
    classComments,
    teacherComments,
    handleSaveComment,
    handleValidateAll,
    handleValidateStudentBulletin,
    isValidationAllowed,
  };
}
