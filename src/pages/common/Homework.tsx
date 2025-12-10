import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button, Modal, Input, Badge } from '../../components/UI';
import {
    Plus,
    BookOpen,
    Calendar,
    Upload,
    Clock,
    X,
    FileText,
    Edit2,
    Trash2,
    Paperclip,
    Download,
    File as FileIcon,
    History,
    EyeOff,
    CheckCircle,
    XCircle,
    ArrowRight
} from 'lucide-react';
import {
    createHomework,
    updateHomework,
    deleteHomework,
    submitHomework,
    gradeSubmission,
    subscribeToSubmissions
} from '../../services/homework';
import { uploadFileWithProgress, generateHomeworkPath } from '../../services/storage';
import type { Homework, Submission, SubmissionFile } from '../../types';
import StudentSelector from '../../components/Common/StudentSelector';

const HomeworkPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { classes, homeworks, courses } = useData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
    const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
    const [showPastHomework, setShowPastHomework] = useState(false);

    // Mobile specific state
    const [mobileTab, setMobileTab] = useState<'todo' | 'done' | 'graded'>('todo');

    // Parent state
    const [selectedChild, setSelectedChild] = useState<{ id: string; name: string; classId: string } | null>(null);


    // Data state
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    // Form state for creating homework
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [maxGrade, setMaxGrade] = useState<number | undefined>(20);
    const [allowOnlineSubmission, setAllowOnlineSubmission] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState('');

    // Submission state
    const [submissionContent, setSubmissionContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [existingFiles, setExistingFiles] = useState<SubmissionFile[]>([]); // Files from previous submission to keep
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [uploadingFiles, setUploadingFiles] = useState(false);

    // Grading state
    const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
    const [gradeValue, setGradeValue] = useState<number>(0);
    const [feedbackValue, setFeedbackValue] = useState('');

    // Student's own submissions (Map of homeworkId -> Submission)
    const [studentSubmissions, setStudentSubmissions] = useState<Map<string, Submission>>(new Map());

    // Subscribe to student's own submissions for each homework (also for parents viewing child)
    useEffect(() => {
        // Determine which student to track
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

        // Subscribe to submissions for each active homework
        homeworks.forEach(hw => {
            const unsub = subscribeToSubmissions(hw.id, (subs) => {
                // Find the target student's submission
                const submission = subs.find(s => s.studentId === targetStudentId);
                setStudentSubmissions(prev => {
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

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [user, homeworks, selectedChild]);

    const handleCreateHomework = async () => {
        if (!title || !dueDate || !selectedClassId) return;

        try {
            const homeworkData: Omit<Homework, 'id'> & { maxGrade?: number } = {
                title,
                subject,
                description,
                dueDate: new Date(dueDate).toISOString(),
                assignedBy: user?.name || '',
                classId: selectedClassId,
                allowOnlineSubmission
            };

            // Only add maxGrade if it's defined (Firebase doesn't accept undefined)
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
            console.error("Error saving homework:", error);
            toast.error(t('homework.toasts.saveError'));
        }
    };

    const handleEditHomework = (homework: Homework) => {
        setEditingHomework(homework);
        setTitle(homework.title);
        setSubject(homework.subject);
        setDescription(homework.description);
        setDueDate(homework.dueDate.split('T')[0]);
        setMaxGrade(homework.maxGrade);
        setAllowOnlineSubmission(homework.allowOnlineSubmission ?? true);
        setSelectedClassId(homework.classId);
        setIsModalOpen(true);
    };

    const handleDeleteHomework = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce devoir ?')) {
            try {
                await deleteHomework(id);
            } catch (error) {
                console.error("Error deleting homework:", error);
            }
        }
    };

    const resetForm = () => {
        setEditingHomework(null);
        setTitle('');
        setSubject('');
        setDescription('');
        setDueDate('');
        setMaxGrade(20);
        setAllowOnlineSubmission(true);
        setSelectedClassId('');
    };

    const handleGradeSubmission = async (
        submissionId: string,
        grade: number,
        feedback: string
    ) => {
        if (!selectedHomework) return;

        try {
            await gradeSubmission(selectedHomework.id, submissionId, grade, feedback);
            setGradingSubmissionId(null);
            setGradeValue(0);
            setFeedbackValue('');
        } catch (error) {
            console.error("Error grading submission:", error);
            toast.error(t('homework.toasts.gradeError'));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
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

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleSubmitHomework = async () => {
        if (!user || !selectedHomework) return;
        // Allow submission if there's content, new files, or existing files
        if (!submissionContent && selectedFiles.length === 0 && existingFiles.length === 0) {
            toast.error(t('homework.toasts.emptySubmission'));
            return;
        }

        setUploadingFiles(true);
        try {
            // Upload new files first
            const uploadedFiles: SubmissionFile[] = [];
            for (const file of selectedFiles) {
                const path = generateHomeworkPath(selectedHomework.id, user.id, file.name);
                const url = await uploadFileWithProgress(
                    file,
                    path,
                    (progress) => {
                        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
                    }
                );
                uploadedFiles.push({
                    name: file.name,
                    url,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString()
                });
            }

            // Merge existing files with newly uploaded files
            const allFiles = [...existingFiles, ...uploadedFiles];

            // Determine studentId/name - use child's data if parent is submitting
            const targetStudentId = user.role === 'parent' && selectedChild ? selectedChild.id : user.id;
            const targetStudentName = user.role === 'parent' && selectedChild ? selectedChild.name : (user.name || '');

            // Submit homework with files
            const submissionData = {
                homeworkId: selectedHomework.id,
                studentId: targetStudentId,
                studentName: targetStudentName,
                content: submissionContent,
                submittedAt: new Date().toISOString(),
                files: allFiles.length > 0 ? allFiles : undefined
            };

            await submitHomework(selectedHomework.id, submissionData);

            // Reset des champs après envoi
            setSubmissionContent('');
            setSelectedFiles([]);
            setExistingFiles([]);
            setUploadProgress({});
            setIsSubmitModalOpen(false);
            toast.success(t('homework.toasts.submitSuccess'));
        } catch (error) {
            console.error("Error submitting homework:", error);
            toast.error(t('homework.toasts.submitError'));
        } finally {
            setUploadingFiles(false);
        }
    };

    const handleViewSubmissions = (homework: Homework) => {
        setSelectedHomework(homework);
        setIsSubmissionsModalOpen(true);
    };

    // Effect to manage submissions subscription when selectedHomework changes
    useEffect(() => {
        if (selectedHomework && isSubmissionsModalOpen) {
            const unsubscribe = subscribeToSubmissions(selectedHomework.id, (data) => {
                setSubmissions(data);
            });
            return () => unsubscribe();
        } else {
            setSubmissions([]);
        }
    }, [selectedHomework, isSubmissionsModalOpen]);

    const getHomeworkStatus = (homework: Homework): 'pending' | 'submitted' | 'graded' | 'overdue' => {
        // For students and parents (viewing child), check submission status
        if (user?.role === 'student' || (user?.role === 'parent' && selectedChild)) {
            const submission = studentSubmissions.get(homework.id);
            if (submission) {
                // Check if already graded
                if (submission.grade !== undefined) {
                    return 'graded';
                }
                return 'submitted';
            }
        }
        if (new Date(homework.dueDate) < new Date()) return 'overdue';
        return 'pending';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="warning">{t('homework.pending')}</Badge>;
            case 'submitted':
                return <Badge variant="info">{t('homework.submitted')}</Badge>;
            case 'graded':
                return <Badge variant="success">{t('homework.graded')}</Badge>;
            case 'overdue':
                return <Badge variant="error">{t('homework.overdue')}</Badge>;
            default:
                return null;
        }
    };

    const getDaysRemaining = (dueDate: string) => {
        const diff = new Date(dueDate).getTime() - new Date().getTime();
        const days = Math.ceil(diff / 86400000);
        return days;
    };

    // Teacher View
    if (user?.role === 'teacher' || user?.role === 'director') {
        const teacherClasses = user.role === 'teacher'
            ? classes.filter(c => c.teacherId === user.id)
            : classes;

        // Séparer les devoirs actifs et passés
        const now = new Date();
        const activeHomeworks = homeworks.filter(hw => new Date(hw.dueDate) >= now);
        const pastHomeworks = homeworks.filter(hw => new Date(hw.dueDate) < now);
        const displayedHomeworks = showPastHomework ? pastHomeworks : activeHomeworks;

        return (
            <div className="space-y-6">
                {/* MOBILE TEACHER VIEW */}
                <div className="block lg:hidden -mx-4 -mt-6 bg-gray-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)] pb-24">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-b-[2rem] shadow-lg mb-6 sticky top-0 z-10">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <BookOpen className="text-white/90" size={24} />
                                {t('homework.title')}
                            </h1>
                        </div>
                        <div className="flex bg-orange-700/30 p-1 rounded-xl backdrop-blur-md">
                            <button
                                onClick={() => setShowPastHomework(false)}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!showPastHomework ? 'bg-white text-orange-600 shadow-sm' : 'text-white/70 hover:text-white'}`}
                            >
                                {t('homework.pending')}
                            </button>
                            <button
                                onClick={() => setShowPastHomework(true)}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${showPastHomework ? 'bg-white text-orange-600 shadow-sm' : 'text-white/70 hover:text-white'}`}
                            >
                                {t('homework.pastHomework')}
                            </button>
                        </div>
                    </div>

                    <div className="px-4 space-y-4">
                        {displayedHomeworks.length === 0 ? (
                            <div className="text-center py-16 flex flex-col items-center opacity-50">
                                <div className="w-16 h-16 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <BookOpen size={32} className="text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">{t('homework.noHomework')}</p>
                            </div>
                        ) : (
                            displayedHomeworks.map(homework => (
                                <div key={homework.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm active:scale-[0.99] transition-transform duration-200 relative overflow-hidden">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${new Date(homework.dueDate) < new Date() ? 'bg-gray-400' : 'bg-orange-500'}`}></div>
                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight mb-1">{homework.title}</h3>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-md">
                                                {homework.subject}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditHomework(homework)} className="p-2 text-gray-400 hover:text-orange-600 bg-gray-100 dark:bg-slate-700 rounded-full">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteHomework(homework.id)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-100 dark:bg-slate-700 rounded-full">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-4 pl-2">
                                        {homework.description}
                                    </p>
                                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 pt-3 pl-2">
                                        <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            {new Date(homework.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        </div>
                                        <button
                                            onClick={() => handleViewSubmissions(homework)}
                                            className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                                        >
                                            <FileIcon size={14} />
                                            Rendus
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="fixed bottom-6 right-6 z-50">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-700 active:scale-95 transition-all"
                        >
                            <Plus size={28} />
                        </button>
                    </div>
                </div>

                {/* DESKTOP TEACHER VIEW */}
                <div className="hidden lg:block space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('homework.title')}</h1>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                icon={showPastHomework ? EyeOff : History}
                                onClick={() => setShowPastHomework(!showPastHomework)}
                            >
                                {showPastHomework ? t('homework.hidePastHomework') : t('homework.showPastHomework')}
                                {pastHomeworks.length > 0 && !showPastHomework && (
                                    <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-full">
                                        {pastHomeworks.length}
                                    </span>
                                )}
                            </Button>
                            <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
                                {t('homework.create')}
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <BookOpen className="text-blue-600 dark:text-blue-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total {t('homework.title')}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{homeworks.length}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Clock className="text-green-600 dark:text-green-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('homework.pending')}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeHomeworks.length}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <History className="text-gray-600 dark:text-gray-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('homework.pastHomework')}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{pastHomeworks.length}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Section Title */}
                    {showPastHomework && (
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <History size={18} />
                            <span className="font-medium">{t('homework.pastHomework')}</span>
                        </div>
                    )}

                    {/* Homework List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {displayedHomeworks.length === 0 ? (
                            <Card className="p-12 text-center col-span-2">
                                <BookOpen size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {showPastHomework ? t('homework.noHomework') : t('homework.noHomework')}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {showPastHomework
                                        ? t('homework.noHomeworkCategory')
                                        : t('homework.noHomeworkCategory')
                                    }
                                </p>
                            </Card>
                        ) : (
                            displayedHomeworks.map(homework => {
                                const isPast = new Date(homework.dueDate) < now;
                                return (
                                    <Card key={homework.id} className={`p-6 ${isPast ? 'opacity-75' : ''}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{homework.title}</h3>
                                                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">{homework.subject}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {t('homework.class')}: {classes.find(c => c.id === homework.classId)?.name || 'Inconnue'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditHomework(homework)}
                                                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteHomework(homework.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{homework.description}</p>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <Calendar size={16} />
                                                <span>{t('homework.dueDate')}: {new Date(homework.dueDate).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                            {homework.maxGrade && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <FileText size={16} />
                                                    <span>{t('homework.maxGrade')}: {homework.maxGrade}</span>
                                                </div>
                                            )}
                                            {!homework.allowOnlineSubmission && (
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 italic">
                                                    <Upload size={16} />
                                                    <span>{t('homework.classroomOnly')}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleViewSubmissions(homework)}
                                            >
                                                {t('homework.viewSubmissions')}
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>

                </div>

                {/* Create Homework Modal */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {editingHomework ? t('homework.edit') : t('homework.create')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Class Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('homework.class')} *</label>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                                >
                                    <option value="">{t('grades.selectClass')}</option>
                                    {teacherClasses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label={t('homework.form.title')}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t('homework.form.titlePlaceholder')}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('homework.subject')}</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                                >
                                    <option value="">{t('grades.selectSubject')}</option>
                                    {/* Get unique subjects from courses for selected class */}
                                    {[...new Set(
                                        courses
                                            .filter(c => !selectedClassId || c.classId === selectedClassId)
                                            .filter(c => user?.role !== 'teacher' || c.teacherId === user.id)
                                            .map(c => c.subject)
                                    )].map(subj => (
                                        <option key={subj} value={subj}>{subj}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('homework.description')}</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                                    placeholder={t('homework.form.descriptionPlaceholder')}
                                />
                            </div>

                            <Input
                                label={t('homework.dueDate')}
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />

                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Input
                                        label={`${t('homework.maxGrade')} (${t('common.optional')})`}
                                        type="number"
                                        value={maxGrade?.toString() || ''}
                                        onChange={(e) => setMaxGrade(e.target.value ? parseInt(e.target.value) : undefined)}
                                        placeholder={t('homework.form.maxGradePlaceholder')}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="allowOnline"
                                    checked={allowOnlineSubmission}
                                    onChange={(e) => setAllowOnlineSubmission(e.target.checked)}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                                />
                                <label htmlFor="allowOnline" className="text-sm text-gray-700 dark:text-gray-300">{t('homework.allowOnlineSubmission')}</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                                    {t('common.cancel')}
                                </Button>
                                <Button variant="primary" onClick={handleCreateHomework}>
                                    {editingHomework ? t('common.save') : t('homework.create')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Submissions Modal */}
                <Modal isOpen={isSubmissionsModalOpen} onClose={() => setIsSubmissionsModalOpen(false)}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('homework.submissionsFor', { title: selectedHomework?.title })}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedHomework?.subject}</p>
                            </div>
                            <button onClick={() => setIsSubmissionsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {selectedHomework && (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {submissions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p className="text-gray-500">{t('homework.noSubmissions')}</p>
                                    </div>
                                ) : (
                                    submissions.map(submission => (
                                        <Card key={submission.id} className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white">{submission.studentName}</h4>
                                                    <p className="text-sm text-gray-500">
                                                        {t('homework.submittedOn')} {new Date(submission.submittedAt).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                                {submission.grade !== undefined ? (
                                                    <Badge variant="success">
                                                        {submission.grade}/{selectedHomework.maxGrade || 20}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="warning">{t('homework.notGraded')}</Badge>
                                                )}
                                            </div>

                                            <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg mb-3">
                                                <p className="text-sm text-gray-700 dark:text-gray-200">{submission.content}</p>
                                            </div>

                                            {/* File Attachments */}
                                            {submission.files && submission.files.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-gray-700 mb-2">{t('homework.attachedFiles')} :</p>
                                                    <div className="space-y-2">
                                                        {submission.files.map((file, fileIndex) => (
                                                            <div key={fileIndex} className="flex items-center justify-between p-2 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-lg">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <FileIcon size={14} className="text-gray-500 flex-shrink-0" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                                                                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    href={file.url}
                                                                    download={file.name}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                                                                >
                                                                    <Download size={14} />
                                                                    {t('common.download')}
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {submission.feedback && (
                                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                                                    <p className="text-sm font-semibold text-green-900 mb-1">{t('homework.feedback')}</p>
                                                    <p className="text-sm text-green-700">{submission.feedback}</p>
                                                </div>
                                            )}

                                            {gradingSubmissionId === submission.id ? (
                                                <div className="space-y-3 p-3 bg-orange-50 rounded-lg">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            {t('homework.grade')} / {selectedHomework.maxGrade || 20}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={selectedHomework.maxGrade || 20}
                                                            value={gradeValue}
                                                            onChange={(e) => setGradeValue(Number(e.target.value))}
                                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            {t('homework.feedback')}
                                                        </label>
                                                        <textarea
                                                            value={feedbackValue}
                                                            onChange={(e) => setFeedbackValue(e.target.value)}
                                                            rows={3}
                                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                                            placeholder={t('homework.form.feedbackPlaceholder')}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setGradingSubmissionId(null);
                                                                setGradeValue(0);
                                                                setFeedbackValue('');
                                                            }}
                                                        >
                                                            {t('common.cancel')}
                                                        </Button>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleGradeSubmission(submission.id, gradeValue, feedbackValue)}
                                                        >
                                                            {t('common.save')}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant={submission.grade !== undefined ? "secondary" : "primary"}
                                                    size="sm"
                                                    onClick={() => {
                                                        setGradingSubmissionId(submission.id);
                                                        setGradeValue(submission.grade || 0);
                                                        setFeedbackValue(submission.feedback || '');
                                                    }}
                                                >
                                                    {submission.grade !== undefined ? t('grades.editGrade') : t('homework.grade')}
                                                </Button>
                                            )}
                                        </Card>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </Modal>
            </div>
        );
    }

    // Student View (and Parent View)
    // Show active homework OR homework that has been submitted (even if past due)
    const now = new Date();
    const visibleHomeworks = homeworks.filter(hw => {
        const status = getHomeworkStatus(hw);
        // Show if not past due, OR if submitted/graded
        return new Date(hw.dueDate) >= now || status === 'submitted' || status === 'graded';
    });

    const filteredHomeworks = visibleHomeworks.filter(hw => {
        if (filter === 'all') return true;
        const status = getHomeworkStatus(hw);
        return status === filter;
    }).filter(hw => {
        // Parent filtering: show only selected child's homework
        if (user?.role === 'parent' && selectedChild) {
            return hw.classId === selectedChild.classId;
        }
        // Student filtering: already handled by DataContext subscriptions mostly, 
        // but can enforce class check if needed (though DataContext does subscription by role)
        return true;
    });

    return (
        <div className="space-y-6">
            {user?.role === 'parent' && (
                <StudentSelector
                    onSelect={setSelectedChild}
                    selectedStudentId={selectedChild?.id}
                />
            )}
            <div className="hidden lg:flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{t('homework.title')}</h1>
            </div>

            {/* Stats - Desktop Only */}
            <div className="hidden lg:grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 cursor-pointer" onClick={() => setFilter('pending')}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="text-orange-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('homework.pending')}</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {homeworks.filter(hw => getHomeworkStatus(hw) === 'pending').length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Content Logic - Split for Mobile/Desktop */}
            {/* Mobile View Container */}
            <div className="block lg:hidden -mx-4 -mt-6 bg-gray-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)] pb-24">
                {/* Mobile Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 rounded-b-[24px] shadow-lg mb-4 sticky top-0 z-10 transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <BookOpen className="text-white/90" size={20} />
                            {t('homework.title')}
                        </h1>
                        {(user?.role as string) === 'teacher' && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-white/20 hover:bg-white/30 text-white p-2 text-sm rounded-full backdrop-blur-sm transition-all"
                            >
                                <Plus size={20} />
                            </button>
                        )}
                    </div>

                    {/* Mobile Tabs */}
                    <div className="flex bg-orange-700/20 p-1 rounded-xl backdrop-blur-md">
                        <button
                            onClick={() => setMobileTab('todo')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${mobileTab === 'todo' ? 'bg-white text-orange-600 shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                        >
                            {t('homework.pending')}
                        </button>
                        <button
                            onClick={() => setMobileTab('done')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${mobileTab === 'done' ? 'bg-white text-orange-600 shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                        >
                            {t('homework.submitted')}
                        </button>
                        <button
                            onClick={() => setMobileTab('graded')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${mobileTab === 'graded' ? 'bg-white text-orange-600 shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                        >
                            {t('homework.graded')}
                        </button>
                    </div>
                </div>

                {/* Mobile List Content */}
                <div className="px-4 space-y-4">
                    {homeworks.filter(hw => {
                        const status = getHomeworkStatus(hw);
                        const isSubmitted = status === 'submitted';
                        const isGraded = status === 'graded';

                        // Map generic status to our 3 tabs
                        if (mobileTab === 'todo') return status === 'pending' || status === 'overdue';
                        if (mobileTab === 'done') return isSubmitted;
                        if (mobileTab === 'graded') return isGraded;
                        return false;
                    }).length === 0 ? (
                        <div className="text-center py-16 flex flex-col items-center opacity-50">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">Aucun devoir dans cette catégorie</p>
                        </div>
                    ) : (
                        homeworks.filter(hw => {
                            const status = getHomeworkStatus(hw);
                            if (mobileTab === 'todo') return status === 'pending' || status === 'overdue';
                            if (mobileTab === 'done') return status === 'submitted';
                            if (mobileTab === 'graded') return status === 'graded';
                            return false;
                        }).map(homework => {
                            const status = getHomeworkStatus(homework);
                            const daysLeft = getDaysRemaining(homework.dueDate);
                            const isOverdue = daysLeft < 0 && status === 'pending';

                            return (
                                <div key={homework.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform duration-200 relative overflow-hidden border border-gray-100 dark:border-slate-700">
                                    {/* Color Stripe based on Subject (mock) */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${daysLeft < 2 && status === 'pending' ? 'bg-red-500' : 'bg-orange-500'}`}></div>

                                    <div className="flex justify-between items-start mb-3 pl-3">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                                                    {homework.subject}
                                                </span>
                                                {isOverdue && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        Since {Math.abs(daysLeft)} days
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate">{homework.title}</h3>
                                        </div>
                                        {/* Status Icon */}
                                        <div className="flex-shrink-0 pt-1">
                                            {status === 'pending' && <div className="bg-gray-100 dark:bg-slate-700 p-1.5 rounded-full"><Clock className="text-gray-400" size={16} /></div>}
                                            {status === 'submitted' && <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full"><CheckCircle className="text-blue-600 dark:text-blue-400" size={16} /></div>}
                                            {status === 'graded' && <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full"><CheckCircle className="text-green-600 dark:text-green-400" size={16} /></div>}
                                            {status === 'overdue' && <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full"><XCircle className="text-red-600 dark:text-red-400" size={16} /></div>}
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2 mb-4 pl-3 leading-relaxed">
                                        {homework.description}
                                    </p>

                                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 pt-3 pl-3">
                                        <div className={`text-xs font-medium flex items-center gap-1.5 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                                            <Calendar size={14} className="stroke-[2.5]" />
                                            {isOverdue
                                                ? <span className="font-bold uppercase tracking-tight">Retard</span>
                                                : <span>{new Date(homework.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                            }
                                        </div>

                                        {/* Action Button */}
                                        {user?.role === 'student' && status === 'pending' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedHomework(homework);
                                                    setIsSubmitModalOpen(true);
                                                }}
                                                className="flex items-center gap-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:bg-gray-800 transition-colors"
                                            >
                                                Rendre
                                                <ArrowRight size={12} />
                                            </button>
                                        )}
                                        {status === 'submitted' && (
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                                                En attente de note
                                            </span>
                                        )}
                                        {status === 'graded' && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-bold text-gray-500 mr-2">Note:</span>
                                                <span className="text-sm font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                                                    {studentSubmissions.get(homework.id)?.grade}/{homework.maxGrade || 20}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Mobile FAB for Teacher */}
                {(user?.role as string) === 'teacher' && (
                    <div className="fixed bottom-6 right-6 z-50">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-700 active:scale-95 transition-all"
                        >
                            <Plus size={28} />
                        </button>
                    </div>
                )}
            </div>

            {/* Desktop View Container */}
            <div className="hidden lg:block space-y-4">
                {filteredHomeworks.map(homework => {
                    const status = getHomeworkStatus(homework);
                    const daysLeft = getDaysRemaining(homework.dueDate);

                    return (
                        <Card key={homework.id} className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">{homework.title}</h3>
                                        {getStatusBadge(status)}
                                    </div>
                                    <p className="text-sm text-orange-600 font-medium mb-2">{homework.subject}</p>
                                    <p className="text-sm text-gray-600">{homework.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="text-gray-400" size={16} />
                                    <span className={daysLeft < 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                        {daysLeft < 0 ? t('homework.overdue') : daysLeft === 0 ? t('schedule.today') : t('homework.daysRemaining', { count: daysLeft })}
                                    </span>
                                </div>
                                {homework.maxGrade && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FileText size={16} />
                                        <span>{t('homework.grade')}: /{homework.maxGrade}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {status === 'pending' && homework.allowOnlineSubmission && (
                                    <Button
                                        variant="primary"
                                        icon={Upload}
                                        onClick={() => {
                                            setSelectedHomework(homework);
                                            setSubmissionContent('');
                                            setSelectedFiles([]);
                                            setIsSubmitModalOpen(true);
                                        }}
                                    >
                                        {t('homework.submit')}
                                    </Button>
                                )}
                                {status === 'pending' && !homework.allowOnlineSubmission && (
                                    <Button variant="secondary" disabled>
                                        {t('homework.classroomOnly')}
                                    </Button>
                                )}
                                {status === 'submitted' && (
                                    <>
                                        {/* Show submission info and edit button if before due date */}
                                        {(() => {
                                            const submission = studentSubmissions.get(homework.id);
                                            const canEdit = new Date(homework.dueDate) >= new Date() && (user?.role === 'student' || (user?.role === 'parent' && selectedChild));
                                            return (
                                                <div className="flex flex-col gap-3 w-full">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="info">{t('homework.submitted')}</Badge>
                                                        <span className="text-xs text-gray-500">
                                                            {t('homework.submittedOn')} {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : ''}
                                                        </span>
                                                        {canEdit && (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                icon={Edit2}
                                                                onClick={() => {
                                                                    setSelectedHomework(homework);
                                                                    setSubmissionContent(submission?.content || '');
                                                                    setExistingFiles(submission?.files || []);
                                                                    setSelectedFiles([]);
                                                                    setIsSubmitModalOpen(true);
                                                                }}
                                                            >
                                                                {t('common.edit')}
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {/* Show submission content */}
                                                    {submission?.content && (
                                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                            <p className="text-sm font-medium text-blue-900 mb-1">{t('homework.yourAnswer')}</p>
                                                            <p className="text-sm text-blue-700 whitespace-pre-wrap">{submission.content}</p>
                                                        </div>
                                                    )}
                                                    {/* Show submitted files */}
                                                    {submission?.files && submission.files.length > 0 && (
                                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                            <p className="text-sm font-medium text-gray-700 mb-2">{t('homework.attachedFiles')}</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {submission.files.map((file, idx) => (
                                                                    <a
                                                                        key={idx}
                                                                        href={file.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                                                    >
                                                                        <FileIcon size={16} className="text-gray-500" />
                                                                        <span className="text-sm text-gray-700">{file.name}</span>
                                                                        <Download size={14} className="text-orange-500" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </>
                                )}
                                {status === 'graded' && (
                                    (() => {
                                        const submission = studentSubmissions.get(homework.id);
                                        return (
                                            <div className="flex flex-col gap-3 w-full">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="success">
                                                        {t('homework.graded')}: {submission?.grade}/{homework.maxGrade || 20}
                                                    </Badge>
                                                </div>
                                                {/* Show feedback */}
                                                {submission?.feedback && (
                                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                        <p className="text-sm font-medium text-green-900 mb-1">{t('homework.feedback')}</p>
                                                        <p className="text-sm text-green-700">{submission.feedback}</p>
                                                    </div>
                                                )}
                                                {/* Show submission content */}
                                                {submission?.content && (
                                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <p className="text-sm font-medium text-blue-900 mb-1">{t('homework.yourAnswer')}</p>
                                                        <p className="text-sm text-blue-700 whitespace-pre-wrap">{submission.content}</p>
                                                    </div>
                                                )}
                                                {/* Show submitted files */}
                                                {submission?.files && submission.files.length > 0 && (
                                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                        <p className="text-sm font-medium text-gray-700 mb-2">{t('homework.attachedFiles')}</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {submission.files.map((file, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={file.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <FileIcon size={16} className="text-gray-500" />
                                                                    <span className="text-sm text-gray-700">{file.name}</span>
                                                                    <Download size={14} className="text-orange-500" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()
                                )}
                            </div>
                        </Card>
                    );
                })}

                {filteredHomeworks.length === 0 && (
                    <Card className="p-12 text-center">
                        <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('homework.noHomework')}</h3>
                        <p className="text-gray-500">{t('homework.noHomeworkCategory')}</p>
                    </Card>
                )}
            </div>

            {/* Submit Homework Modal */}
            <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('homework.submit')}</h2>
                        <button onClick={() => setIsSubmitModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    {selectedHomework && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{selectedHomework.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{selectedHomework.description}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('homework.yourAnswer')}</label>
                                <textarea
                                    value={submissionContent}
                                    onChange={(e) => setSubmissionContent(e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                    placeholder={t('homework.form.answerPlaceholder')}
                                />
                            </div>

                            {/* File Upload Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('homework.attachedFiles')} ({t('common.optional')})</label>
                                <div className="space-y-3">
                                    {/* Existing Files from previous submission */}
                                    {existingFiles.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-gray-500 font-medium">{t('homework.existingFiles')}</p>
                                            {existingFiles.map((file, index) => (
                                                <div key={`existing-${index}`} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <FileIcon size={16} className="text-blue-500" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-blue-900 truncate">{file.name}</p>
                                                            <p className="text-xs text-blue-600">{t('homework.alreadyUploaded')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                                                            title={t('common.download')}
                                                        >
                                                            <Download size={16} />
                                                        </a>
                                                        <button
                                                            onClick={() => setExistingFiles(prev => prev.filter((_, i) => i !== index))}
                                                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title={t('common.delete')}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* File Input Button */}
                                    <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors cursor-pointer">
                                        <Paperclip size={18} className="text-gray-500" />
                                        <span className="text-sm text-gray-600">{t('homework.form.attachFileHelp')}</span>
                                        <input
                                            type="file"
                                            onChange={handleFileSelect}
                                            multiple
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                                            className="hidden"
                                        />
                                    </label>

                                    {/* Selected Files List */}
                                    {selectedFiles.length > 0 && (
                                        <div className="space-y-2">
                                            {selectedFiles.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <FileIcon size={16} className="text-gray-500" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                            {uploadProgress[file.name] !== undefined && (
                                                                <div className="mt-1">
                                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                        <div
                                                                            className="bg-orange-600 h-1.5 rounded-full transition-all"
                                                                            style={{ width: `${uploadProgress[file.name]}%` }}
                                                                        />
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 mt-0.5">{Math.round(uploadProgress[file.name])}%</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!uploadingFiles && (
                                                        <button
                                                            onClick={() => handleRemoveFile(index)}
                                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)} disabled={uploadingFiles}>
                                    {t('common.cancel')}
                                </Button>
                                <Button variant="primary" icon={Upload} onClick={handleSubmitHomework} disabled={uploadingFiles}>
                                    {uploadingFiles ? 'Envoi en cours...' : t('homework.submit')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default HomeworkPage;
