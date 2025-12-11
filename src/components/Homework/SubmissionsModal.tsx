import { useTranslation } from 'react-i18next';
import { Modal, Card, Button, Badge, Input } from '../UI';
import { X, BookOpen, File as FileIcon, Download } from 'lucide-react';
import type { Homework, Submission } from '../../types';

interface SubmissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    homework: Homework | null;
    submissions: Submission[];
    gradingSubmissionId: string | null;
    setGradingSubmissionId: (id: string | null) => void;
    gradeValue: number;
    setGradeValue: (value: number) => void;
    feedbackValue: string;
    setFeedbackValue: (value: string) => void;
    onGradeSubmission: (submissionId: string, grade: number, feedback: string) => void;
    formatFileSize: (bytes: number) => string;
}

export function SubmissionsModal({
    isOpen,
    onClose,
    homework,
    submissions,
    gradingSubmissionId,
    setGradingSubmissionId,
    gradeValue,
    setGradeValue,
    feedbackValue,
    setFeedbackValue,
    onGradeSubmission,
    formatFileSize
}: SubmissionsModalProps) {
    const { t } = useTranslation();

    if (!homework) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('homework.submissionsFor', { title: homework.title })}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{homework.subject}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

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
                                        <h4 className="font-bold text-gray-900 dark:text-white">
                                            {submission.studentName}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {t('homework.submittedOn')} {new Date(submission.submittedAt).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                    {submission.grade !== undefined ? (
                                        <Badge variant="success">
                                            {submission.grade}/{homework.maxGrade || 20}
                                        </Badge>
                                    ) : (
                                        <Badge variant="warning">{t('homework.notGraded')}</Badge>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg mb-3">
                                    <p className="text-sm text-gray-700 dark:text-gray-200">{submission.content}</p>
                                </div>

                                {/* File Attachments */}
                                {submission.files && submission.files.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs font-semibold text-gray-700 mb-2">
                                            {t('homework.attachedFiles')} :
                                        </p>
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

                                {/* Existing Feedback */}
                                {submission.feedback && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                                        <p className="text-sm font-semibold text-green-900 mb-1">{t('homework.feedback')}</p>
                                        <p className="text-sm text-green-700">{submission.feedback}</p>
                                    </div>
                                )}

                                {/* Grading Form */}
                                {gradingSubmissionId === submission.id ? (
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg space-y-3">
                                        <Input
                                            label={t('homework.grade')}
                                            type="number"
                                            value={gradeValue.toString()}
                                            onChange={(e) => setGradeValue(parseInt(e.target.value) || 0)}
                                            min={0}
                                            max={homework.maxGrade || 20}
                                        />
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
                                                variant="primary"
                                                size="sm"
                                                onClick={() => onGradeSubmission(submission.id, gradeValue, feedbackValue)}
                                            >
                                                {t('common.save')}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setGradingSubmissionId(null)}
                                            >
                                                {t('common.cancel')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setGradingSubmissionId(submission.id);
                                            setGradeValue(submission.grade || 0);
                                            setFeedbackValue(submission.feedback || '');
                                        }}
                                    >
                                        {submission.grade !== undefined ? t('common.edit') : t('homework.grade')}
                                    </Button>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
}

export default SubmissionsModal;
