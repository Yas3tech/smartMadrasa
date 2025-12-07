import { useState, useEffect } from 'react';
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
    File as FileIcon
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

const HomeworkPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { classes, homeworks } = useData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
    const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

    // Data state
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    // Form state for creating homework
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('Mathématiques');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [maxGrade, setMaxGrade] = useState<number | undefined>(20);
    const [allowOnlineSubmission, setAllowOnlineSubmission] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState('');

    // Submission state
    const [submissionContent, setSubmissionContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [uploadingFiles, setUploadingFiles] = useState(false);

    // Grading state
    const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
    const [gradeValue, setGradeValue] = useState<number>(0);
    const [feedbackValue, setFeedbackValue] = useState('');

    const handleCreateHomework = async () => {
        if (!title || !dueDate || !selectedClassId) return;

        try {
            const homeworkData: any = {
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
            alert("Erreur lors de l'enregistrement du devoir");
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
        setSubject('Mathématiques');
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
            alert("Erreur lors de l'enregistrement de la note");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                alert(`${file.name} est trop volumineux (max 10MB)`);
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
        if (!submissionContent && selectedFiles.length === 0) {
            alert("Veuillez saisir une réponse ou joindre un fichier");
            return;
        }

        setUploadingFiles(true);
        try {
            // Upload files first
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

            // Submit homework with files
            const submissionData: any = {
                studentId: user.id,
                studentName: user.name || '',
                content: submissionContent,
                submittedAt: new Date().toISOString(),
                files: uploadedFiles.length > 0 ? uploadedFiles : undefined
            };

            await submitHomework(selectedHomework.id, submissionData);

            // Reset des champs après envoi
            setSubmissionContent('');
            setSelectedFiles([]);
            setUploadProgress({});
            setIsSubmitModalOpen(false);
            alert("Devoir rendu avec succès !");
        } catch (error) {
            console.error("Error submitting homework:", error);
            alert("Erreur lors de l'envoi du devoir");
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

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">{t('homework.title')}</h1>
                    <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
                        {t('homework.create')}
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="text-blue-600" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total {t('homework.title')}</p>
                                <p className="text-2xl font-bold text-gray-900">{homeworks.length}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Homework List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {homeworks.map(homework => (
                        <Card key={homework.id} className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{homework.title}</h3>
                                    <p className="text-sm text-orange-600 font-medium">{homework.subject}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {t('homework.class')}: {classes.find(c => c.id === homework.classId)?.name || 'Inconnue'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditHomework(homework)}
                                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteHomework(homework.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">{homework.description}</p>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar size={16} />
                                    <span>{t('homework.dueDate')}: {new Date(homework.dueDate).toLocaleDateString('fr-FR')}</span>
                                </div>
                                {homework.maxGrade && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FileText size={16} />
                                        <span>{t('homework.maxGrade')}: {homework.maxGrade}</span>
                                    </div>
                                )}
                                {!homework.allowOnlineSubmission && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                                        <Upload size={16} />
                                        <span>{t('homework.classroomOnly')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleViewSubmissions(homework)}
                                >
                                    {t('homework.viewSubmissions')}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Create Homework Modal */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingHomework ? t('homework.edit') : t('homework.create')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Class Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('homework.class')} *</label>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('homework.subject')}</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                >
                                    <option>Mathématiques</option>
                                    <option>Français</option>
                                    <option>Arabe</option>
                                    <option>Sciences</option>
                                    <option>Histoire</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('homework.description')}</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
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
                                <label htmlFor="allowOnline" className="text-sm text-gray-700">{t('homework.allowOnlineSubmission')}</label>
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
                                <h2 className="text-2xl font-bold text-gray-900">{t('homework.submissionsFor', { title: selectedHomework?.title })}</h2>
                                <p className="text-sm text-gray-500">{selectedHomework?.subject}</p>
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
                                                    <h4 className="font-bold text-gray-900">{submission.studentName}</h4>
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

                                            <div className="p-3 bg-gray-50 rounded-lg mb-3">
                                                <p className="text-sm text-gray-700">{submission.content}</p>
                                            </div>

                                            {/* File Attachments */}
                                            {submission.files && submission.files.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-gray-700 mb-2">{t('homework.attachedFiles')} :</p>
                                                    <div className="space-y-2">
                                                        {submission.files.map((file, fileIndex) => (
                                                            <div key={fileIndex} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <FileIcon size={14} className="text-gray-500 flex-shrink-0" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
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
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
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

    // Student View
    const filteredHomeworks = homeworks.filter(hw => {
        if (filter === 'all') return true;
        const status = getHomeworkStatus(hw);
        return status === filter;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{t('homework.title')}</h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            {/* Homework Cards */}
            <div className="space-y-4">
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
                        <h2 className="text-2xl font-bold text-gray-900">{t('homework.submit')}</h2>
                        <button onClick={() => setIsSubmitModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    {selectedHomework && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <h3 className="font-semibold text-gray-900 mb-1">{selectedHomework.title}</h3>
                                <p className="text-sm text-gray-600">{selectedHomework.description}</p>
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
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
