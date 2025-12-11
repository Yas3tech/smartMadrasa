/**
 * Homework Page - Container Component
 * 
 * This is a lightweight container (~250 lines) that:
 * - Uses the useHomework hook for all business logic
 * - Composes UI from Homework components
 * - Handles role-based view switching
 */

import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useHomework } from '../../hooks/useHomework';
import { Card, Button } from '../../components/UI';
import { HomeworkCard, HomeworkForm, SubmissionsModal, SubmitHomeworkModal } from '../../components/Homework';
import StudentSelector from '../../components/Common/StudentSelector';
import { Plus, BookOpen, Clock, History, EyeOff } from 'lucide-react';

const HomeworkPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { classes, homeworks, courses } = useData();

    const hw = useHomework();

    if (!user) return null;

    // Compute derived data
    const now = new Date();
    const teacherClasses = user.role === 'teacher'
        ? classes.filter(c => c.teacherId === user.id)
        : classes;

    const activeHomeworks = homeworks.filter(h => new Date(h.dueDate) >= now);
    const pastHomeworks = homeworks.filter(h => new Date(h.dueDate) < now);
    const displayedHomeworks = hw.showPastHomework ? pastHomeworks : activeHomeworks;

    // Filter homeworks by student's class
    const targetClassId = hw.selectedChild?.classId || (user.role === 'student' ? (user as { classId?: string }).classId : null);
    const studentHomeworks = targetClassId
        ? homeworks.filter(h => h.classId === targetClassId)
        : [];
    const studentActiveHomeworks = studentHomeworks.filter(h => new Date(h.dueDate) >= now);

    // Open submit modal handler
    const openSubmitModal = (homework: typeof homeworks[0]) => {
        hw.setSelectedHomework(homework);

        // Load existing submission content if available
        const existingSubmission = hw.studentSubmissions.get(homework.id);
        if (existingSubmission) {
            hw.setSubmissionContent(existingSubmission.content || '');
            hw.setExistingFiles(existingSubmission.files || []);
        } else {
            hw.setSubmissionContent('');
            hw.setExistingFiles([]);
        }
        hw.setSelectedFiles([]);
        hw.setIsSubmitModalOpen(true);
    };

    // Teacher/Director View
    if (user.role === 'teacher' || user.role === 'director') {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('homework.title')}</h1>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            icon={hw.showPastHomework ? EyeOff : History}
                            onClick={() => hw.setShowPastHomework(!hw.showPastHomework)}
                        >
                            {hw.showPastHomework ? t('homework.hidePastHomework') : t('homework.showPastHomework')}
                            {pastHomeworks.length > 0 && !hw.showPastHomework && (
                                <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-full">
                                    {pastHomeworks.length}
                                </span>
                            )}
                        </Button>
                        <Button variant="primary" icon={Plus} onClick={() => hw.setIsModalOpen(true)}>
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
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
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

                {/* Homework List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {displayedHomeworks.length === 0 ? (
                        <Card className="p-12 text-center col-span-2">
                            <BookOpen size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {t('homework.noHomework')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">{t('homework.noHomeworkCategory')}</p>
                        </Card>
                    ) : (
                        displayedHomeworks.map(homework => (
                            <HomeworkCard
                                key={homework.id}
                                homework={homework}
                                status={hw.getHomeworkStatus(homework)}
                                daysRemaining={hw.getDaysRemaining(homework.dueDate)}
                                isPast={new Date(homework.dueDate) < now}
                                isTeacher={true}
                                onEdit={hw.handleEditHomework}
                                onDelete={hw.handleDeleteHomework}
                                onViewSubmissions={hw.handleViewSubmissions}
                            />
                        ))
                    )}
                </div>

                {/* Modals */}
                <HomeworkForm
                    isOpen={hw.isModalOpen}
                    onClose={() => { hw.setIsModalOpen(false); hw.resetForm(); }}
                    formState={hw.formState}
                    setFormField={hw.setFormField}
                    onSubmit={hw.handleCreateHomework}
                    isEditing={!!hw.editingHomework}
                    teacherClasses={teacherClasses}
                    courses={courses}
                    userId={user.id}
                    userRole={user.role}
                />

                <SubmissionsModal
                    isOpen={hw.isSubmissionsModalOpen}
                    onClose={() => hw.setIsSubmissionsModalOpen(false)}
                    homework={hw.selectedHomework}
                    submissions={hw.submissions}
                    gradingSubmissionId={hw.gradingSubmissionId}
                    setGradingSubmissionId={hw.setGradingSubmissionId}
                    gradeValue={hw.gradeValue}
                    setGradeValue={hw.setGradeValue}
                    feedbackValue={hw.feedbackValue}
                    setFeedbackValue={hw.setFeedbackValue}
                    onGradeSubmission={hw.handleGradeSubmission}
                    formatFileSize={hw.formatFileSize}
                />
            </div>
        );
    }

    // Student/Parent View
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('homework.title')}</h1>
            </div>

            {/* Parent Child Selector */}
            {user.role === 'parent' && (
                <StudentSelector
                    onSelect={hw.setSelectedChild}
                    selectedStudentId={hw.selectedChild?.id}
                />
            )}

            {/* Homework List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {studentActiveHomeworks.length === 0 ? (
                    <Card className="p-12 text-center col-span-2">
                        <BookOpen size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {t('homework.noHomework')}
                        </h3>
                    </Card>
                ) : (
                    studentActiveHomeworks.map(homework => {
                        const submission = hw.studentSubmissions.get(homework.id);
                        return (
                            <HomeworkCard
                                key={homework.id}
                                homework={homework}
                                status={hw.getHomeworkStatus(homework)}
                                daysRemaining={hw.getDaysRemaining(homework.dueDate)}
                                isTeacher={false}
                                onSubmit={openSubmitModal}
                                submission={submission}
                            />
                        );
                    })
                )}
            </div>

            {/* Submit Modal */}
            <SubmitHomeworkModal
                isOpen={hw.isSubmitModalOpen}
                onClose={() => hw.setIsSubmitModalOpen(false)}
                homework={hw.selectedHomework}
                submissionContent={hw.submissionContent}
                setSubmissionContent={hw.setSubmissionContent}
                selectedFiles={hw.selectedFiles}
                existingFiles={hw.existingFiles}
                setExistingFiles={hw.setExistingFiles}
                uploadProgress={hw.uploadProgress}
                uploadingFiles={hw.uploadingFiles}
                onSubmit={hw.handleSubmitHomework}
                onFileSelect={hw.handleFileSelect}
                onRemoveFile={hw.handleRemoveFile}
                formatFileSize={hw.formatFileSize}
                existingSubmission={hw.selectedHomework ? hw.studentSubmissions.get(hw.selectedHomework.id) : undefined}
            />
        </div>
    );
};

export default HomeworkPage;
