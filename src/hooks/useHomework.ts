import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  createHomework,
  updateHomework,
  deleteHomework,
  submitHomework,
  updateSubmission,
  subscribeToSubmissions,
  gradeSubmission,
} from '../services/homework';
import { uploadFileWithProgress, generateHomeworkPath } from '../services/storage';
import type { Homework, Submission, SubmissionFile } from '../types';

export interface FormState {
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  maxGrade: number | undefined;
  allowOnlineSubmission: boolean;
  isGraded: boolean;
  selectedClassId: string;
}

export interface UseHomeworkReturn {
  // States
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isSubmitModalOpen: boolean;
  setIsSubmitModalOpen: (open: boolean) => void;
  isSubmissionsModalOpen: boolean;
  setIsSubmissionsModalOpen: (open: boolean) => void;
  selectedHomework: Homework | null;
  setSelectedHomework: (hw: Homework | null) => void;
  editingHomework: Homework | null;
  showPastHomework: boolean;
  setShowPastHomework: (show: boolean) => void;
  mobileTab: 'todo' | 'done' | 'graded';
  setMobileTab: (tab: 'todo' | 'done' | 'graded') => void;
  selectedChild: { id: string; name: string; classId: string } | null;
  setSelectedChild: (child: { id: string; name: string; classId: string } | null) => void;
  submissions: Submission[];
  studentSubmissions: Map<string, Submission>;

  // Form state
  formState: FormState;
  setFormField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;

  // Submission state
  submissionContent: string;
  setSubmissionContent: (content: string) => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  existingFiles: SubmissionFile[];
  setExistingFiles: (files: SubmissionFile[]) => void;
  uploadProgress: Record<string, number>;
  uploadingFiles: boolean;

  // Grading state
  gradingSubmissionId: string | null;
  setGradingSubmissionId: (id: string | null) => void;
  gradeValue: number;
  setGradeValue: (value: number) => void;
  feedbackValue: string;
  setFeedbackValue: (value: string) => void;

  // Handlers
  handleCreateHomework: () => Promise<void>;
  handleEditHomework: (homework: Homework) => void;
  handleDeleteHomework: (id: string) => Promise<void>;
  handleSubmitHomework: () => Promise<void>;
  handleGradeSubmission: (submissionId: string, grade: number, feedback: string) => Promise<void>;
  handleViewSubmissions: (homework: Homework) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: (index: number) => void;
  resetForm: () => void;

  // Utilities
  getHomeworkStatus: (homework: Homework) => 'pending' | 'submitted' | 'graded' | 'overdue';
  getDaysRemaining: (dueDate: string) => number;
  formatFileSize: (bytes: number) => string;
}

export function useHomework(): UseHomeworkReturn {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [showPastHomework, setShowPastHomework] = useState(false);
  const [mobileTab, setMobileTab] = useState<'todo' | 'done' | 'graded'>('todo');
  const [selectedChild, setSelectedChild] = useState<{
    id: string;
    name: string;
    classId: string;
  } | null>(null);

  // Data state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentSubmissions, setStudentSubmissions] = useState<Map<string, Submission>>(new Map());

  // Form state
  const [formState, setFormState] = useState<FormState>({
    title: '',
    subject: '',
    description: '',
    dueDate: '',
    maxGrade: undefined,
    allowOnlineSubmission: true,
    isGraded: false,
    selectedClassId: '',
  });

  // Submission state
  const [submissionContent, setSubmissionContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<SubmissionFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Grading state
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState<number>(0);
  const [feedbackValue, setFeedbackValue] = useState('');

  const { homeworks } = useData();

  // Set individual form field
  const setFormField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Subscribe to student submissions
  useEffect(() => {
    let targetStudentId: string | null = null;
    if (user?.role === 'student') {
      targetStudentId = user.id;
    } else if (user?.role === 'parent' && selectedChild) {
      targetStudentId = selectedChild.id;
    }

    if (!targetStudentId) {
      setStudentSubmissions(new Map());
      return;
    }

    const unsubscribes: (() => void)[] = [];
    homeworks.forEach((hw) => {
      const unsub = subscribeToSubmissions(hw.id, (subs) => {
        const submission = subs.find((s) => s.studentId === targetStudentId);
        setStudentSubmissions((prev) => {
          const newMap = new Map(prev);
          if (submission) {
            newMap.set(hw.id, submission);
          } else {
            newMap.delete(hw.id);
          }
          return newMap;
        });
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [user, homeworks, selectedChild]);

  // Subscribe to submissions for modal
  useEffect(() => {
    if (selectedHomework && isSubmissionsModalOpen) {
      const unsubscribe = subscribeToSubmissions(selectedHomework.id, setSubmissions);
      return () => unsubscribe();
    } else {
      setSubmissions([]);
    }
  }, [selectedHomework, isSubmissionsModalOpen]);

  // Handlers
  const handleCreateHomework = async () => {
    const {
      title,
      dueDate,
      selectedClassId,
      subject,
      description,
      allowOnlineSubmission,
      maxGrade,
    } = formState;
    if (!title || !dueDate || !selectedClassId) return;

    try {
      const homeworkData: Omit<Homework, 'id'> & { maxGrade?: number } = {
        title,
        subject,
        description,
        dueDate: new Date(dueDate).toISOString(),
        assignedBy: user?.name || '',
        classId: selectedClassId,
        allowOnlineSubmission,
      };

      if (maxGrade !== undefined && maxGrade !== null) {
        homeworkData.maxGrade = maxGrade;
      }

      if (editingHomework) {
        await updateHomework(editingHomework.id, homeworkData);
      } else {
        await createHomework(homeworkData);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving homework:', error);
      toast.error(t('homework.toasts.saveError'));
    }
  };

  const handleEditHomework = (homework: Homework) => {
    setEditingHomework(homework);
    setFormState({
      title: homework.title,
      subject: homework.subject,
      description: homework.description,
      dueDate: homework.dueDate.split('T')[0],
      isGraded: homework.maxGrade !== undefined && homework.maxGrade > 0,
      maxGrade: homework.maxGrade,
      allowOnlineSubmission: homework.allowOnlineSubmission ?? true,
      selectedClassId: homework.classId,
    });
    setIsModalOpen(true);
  };

  const handleDeleteHomework = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce devoir ?')) {
      try {
        await deleteHomework(id);
      } catch (error) {
        console.error('Error deleting homework:', error);
      }
    }
  };

  const resetForm = () => {
    setEditingHomework(null);
    setFormState({
      title: '',
      subject: '',
      description: '',
      dueDate: '',
      isGraded: false,
      maxGrade: undefined,
      allowOnlineSubmission: true,
      selectedClassId: '',
    });
  };

  const handleGradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    if (!selectedHomework) return;
    try {
      await gradeSubmission(selectedHomework.id, submissionId, grade, feedback);
      setGradingSubmissionId(null);
      setGradeValue(0);
      setFeedbackValue('');
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error(t('homework.toasts.gradeError'));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(t('homework.toasts.fileTooLarge', { name: file.name }));
        return false;
      }
      return true;
    });
    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmitHomework = async () => {
    if (!user || !selectedHomework) return;
    if (!submissionContent && selectedFiles.length === 0 && existingFiles.length === 0) {
      toast.error(t('homework.toasts.emptySubmission'));
      return;
    }

    setUploadingFiles(true);
    try {
      const uploadedFiles: SubmissionFile[] = [];
      for (const file of selectedFiles) {
        const path = generateHomeworkPath(selectedHomework.id, user.id, file.name);
        const url = await uploadFileWithProgress(file, path, (progress) => {
          setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
        });
        uploadedFiles.push({
          name: file.name,
          url,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        });
      }

      const allFiles = [...existingFiles, ...uploadedFiles];
      const targetStudentId = user.role === 'parent' && selectedChild ? selectedChild.id : user.id;
      const targetStudentName =
        user.role === 'parent' && selectedChild ? selectedChild.name : user.name || '';
      const existingSubmission = studentSubmissions.get(selectedHomework.id);

      if (existingSubmission) {
        await updateSubmission(selectedHomework.id, existingSubmission.id, {
          content: submissionContent,
          submittedAt: new Date().toISOString(),
          files: allFiles.length > 0 ? allFiles : undefined,
        });
      } else {
        await submitHomework(selectedHomework.id, {
          homeworkId: selectedHomework.id,
          studentId: targetStudentId,
          studentName: targetStudentName,
          content: submissionContent,
          submittedAt: new Date().toISOString(),
          files: allFiles.length > 0 ? allFiles : undefined,
        });
      }

      setSubmissionContent('');
      setSelectedFiles([]);
      setExistingFiles([]);
      setUploadProgress({});
      setIsSubmitModalOpen(false);
      toast.success(t('homework.toasts.submitSuccess'));
    } catch (error) {
      console.error('Error submitting homework:', error);
      toast.error(t('homework.toasts.submitError'));
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleViewSubmissions = (homework: Homework) => {
    setSelectedHomework(homework);
    setIsSubmissionsModalOpen(true);
  };

  // Utilities
  const getHomeworkStatus = (
    homework: Homework
  ): 'pending' | 'submitted' | 'graded' | 'overdue' => {
    if (user?.role === 'student' || (user?.role === 'parent' && selectedChild)) {
      const submission = studentSubmissions.get(homework.id);
      if (submission) {
        if (submission.grade !== undefined) return 'graded';
        return 'submitted';
      }
    }
    if (new Date(homework.dueDate) < new Date()) return 'overdue';
    return 'pending';
  };

  const getDaysRemaining = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    return Math.ceil(diff / 86400000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return {
    isModalOpen,
    setIsModalOpen,
    isSubmitModalOpen,
    setIsSubmitModalOpen,
    isSubmissionsModalOpen,
    setIsSubmissionsModalOpen,
    selectedHomework,
    setSelectedHomework,
    editingHomework,
    showPastHomework,
    setShowPastHomework,
    mobileTab,
    setMobileTab,
    selectedChild,
    setSelectedChild,
    submissions,
    studentSubmissions,
    formState,
    setFormField,
    submissionContent,
    setSubmissionContent,
    selectedFiles,
    setSelectedFiles,
    existingFiles,
    setExistingFiles,
    uploadProgress,
    uploadingFiles,
    gradingSubmissionId,
    setGradingSubmissionId,
    gradeValue,
    setGradeValue,
    feedbackValue,
    setFeedbackValue,
    handleCreateHomework,
    handleEditHomework,
    handleDeleteHomework,
    handleSubmitHomework,
    handleGradeSubmission,
    handleViewSubmissions,
    handleFileSelect,
    handleRemoveFile,
    resetForm,
    getHomeworkStatus,
    getDaysRemaining,
    formatFileSize,
  };
}
