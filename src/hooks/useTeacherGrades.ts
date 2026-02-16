import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';
import type { Grade, Student, ClassGroup } from '../types';

export type ViewMode = 'byStudent' | 'bySubject' | null;

export interface UseTeacherGradesReturn {
  // States
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  selectedSubject: string;
  setSelectedSubject: (subject: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isBulkModalOpen: boolean;
  setIsBulkModalOpen: (open: boolean) => void;
  isGradeModalOpen: boolean;
  setIsGradeModalOpen: (open: boolean) => void;
  editingGrade: Grade | null;
  editValue: string;
  setEditValue: (value: string) => void;
  handleBulkSave: (grades: Omit<Grade, 'id'>[]) => Promise<void>;

  // Derived Data
  teacherClasses: ClassGroup[];
  selectedClass: ClassGroup | undefined;
  selectedStudentData: Student | undefined;
  filteredStudents: Student[];
  classSubjects: string[];
  studentGrades: Grade[];
  subjectGrades: Grade[];
  subjectGradesByStudent: Record<string, Grade[]>;

  // Handlers
  startEditingGrade: (grade: Grade) => void;
  cancelEditing: () => void;
  handleUpdateGrade: () => Promise<void>;
  handleIndividualGradeSave: (gradeData: Omit<Grade, 'id'>) => Promise<void>;
  goBack: () => void;
  getCurrentStep: () => number;
}

export function useTeacherGrades(): UseTeacherGradesReturn {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { students, classes, grades, addGrade, updateGrade, courses } = useData();

  // Navigation States
  const [selectedClassId, setSelectedClassId] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

  // Grade editing state
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editValue, setEditValue] = useState('');

  // Derived Data
  const teacherClasses = useMemo(() => {
    if (user?.role === 'teacher') {
      return classes.filter((c) => c.teacherId === user.id);
    }
    return classes;
  }, [classes, user]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedStudentData = students.find((s) => s.id === selectedStudentId);

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter(
      (s) =>
        (s as Student).classId === selectedClassId &&
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedClassId, students, searchTerm]);

  const classSubjects = useMemo(() => {
    if (!selectedClassId) return [];
    const classCourses = courses.filter((c) => c.classId === selectedClassId);
    return [...new Set(classCourses.map((c) => c.subject))].sort();
  }, [courses, selectedClassId]);

  const studentGrades = useMemo(() => {
    if (!selectedStudentId) return [];
    return grades
      .filter((g) => g.studentId === selectedStudentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [grades, selectedStudentId]);

  const subjectGrades = useMemo(() => {
    if (!selectedSubject || !selectedClassId) return [];
    return grades.filter((g) => {
      const student = students.find((s) => s.id === g.studentId);
      return g.subject === selectedSubject && (student as Student)?.classId === selectedClassId;
    });
  }, [grades, selectedSubject, selectedClassId, students]);

  const subjectGradesByStudent = useMemo(() => {
    const grouped: Record<string, Grade[]> = {};
    subjectGrades.forEach((grade) => {
      if (!grouped[grade.studentId]) {
        grouped[grade.studentId] = [];
      }
      grouped[grade.studentId].push(grade);
    });
    return grouped;
  }, [subjectGrades]);

  // Handlers
  const startEditingGrade = (grade: Grade) => {
    setEditingGrade(grade);
    setEditValue(grade.score.toString());
  };

  const cancelEditing = () => {
    setEditingGrade(null);
    setEditValue('');
  };

  const handleUpdateGrade = async () => {
    if (!editingGrade) return;
    const newScore = parseFloat(editValue);
    if (isNaN(newScore) || newScore < 0 || newScore > editingGrade.maxScore) {
      toast.error(t('grades.invalidScore'));
      return;
    }
    try {
      await updateGrade(editingGrade.id, { score: newScore });
      toast.success(t('grades.gradeUpdated'));
      setEditingGrade(null);
      setEditValue('');
    } catch {
      toast.error(t('grades.errorUpdating'));
    }
  };

  const handleBulkSave = async (gradesData: Omit<Grade, 'id'>[]) => {
    try {
      // Parallel save for performance
      await Promise.all(
        gradesData.map((grade) =>
          addGrade({
            ...grade,
            teacherId: user?.id || "",
            classId: selectedClassId,
            courseId: courses.find(
              (c) => c.subject === grade.subject && c.classId === selectedClassId
            )?.id,
          })
        )
      );
      toast.success(t("grades.gradesSaved"));
      setIsBulkModalOpen(false);
    } catch {
      toast.error(t('grades.saveError'));
    }
  };

  const handleIndividualGradeSave = async (gradeData: Omit<Grade, 'id'>) => {
    try {
      await addGrade({
        ...gradeData,
        teacherId: user?.id || '',
        classId: selectedClassId,
        courseId: courses.find(
          (c) => c.subject === gradeData.subject && c.classId === selectedClassId
        )?.id,
      });
      toast.success(t('grades.gradeAdded'));
      setIsGradeModalOpen(false);
    } catch {
      toast.error(t('grades.saveError'));
    }
  };

  const goBack = () => {
    if (selectedStudentId) {
      setSelectedStudentId('');
    } else if (selectedSubject) {
      setSelectedSubject('');
    } else if (viewMode) {
      setViewMode(null);
    } else if (selectedClassId) {
      setSelectedClassId('');
    }
  };

  const getCurrentStep = () => {
    if (!selectedClassId) return 1;
    if (!viewMode) return 2;
    return 3;
  };

  return {
    selectedClassId,
    setSelectedClassId,
    viewMode,
    setViewMode,
    selectedStudentId,
    setSelectedStudentId,
    selectedSubject,
    setSelectedSubject,
    searchTerm,
    setSearchTerm,
    isBulkModalOpen,
    setIsBulkModalOpen,
    isGradeModalOpen,
    setIsGradeModalOpen,
    editingGrade,
    editValue,
    setEditValue,
    teacherClasses,
    selectedClass,
    selectedStudentData,
    filteredStudents,
    classSubjects,
    studentGrades,
    subjectGrades,
    subjectGradesByStudent,
    startEditingGrade,
    cancelEditing,
    handleUpdateGrade,
    handleIndividualGradeSave,
    handleBulkSave,
    goBack,
    getCurrentStep,
  };
}
