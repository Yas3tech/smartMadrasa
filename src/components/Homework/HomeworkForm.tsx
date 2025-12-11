import { useTranslation } from 'react-i18next';
import { Modal, Button, Input } from '../UI';
import { X } from 'lucide-react';
import type { FormState } from '../../hooks/useHomework';
import type { ClassGroup, Course } from '../../types';

interface HomeworkFormProps {
    isOpen: boolean;
    onClose: () => void;
    formState: FormState;
    setFormField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
    onSubmit: () => void;
    isEditing: boolean;
    teacherClasses: ClassGroup[];
    courses: Course[];
    userId?: string;
    userRole?: string;
}

export function HomeworkForm({
    isOpen,
    onClose,
    formState,
    setFormField,
    onSubmit,
    isEditing,
    teacherClasses,
    courses,
    userId,
    userRole
}: HomeworkFormProps) {
    const { t } = useTranslation();

    // Get subjects for selected class
    const availableSubjects = [...new Set(
        courses
            .filter(c => !formState.selectedClassId || c.classId === formState.selectedClassId)
            .filter(c => userRole !== 'teacher' || c.teacherId === userId)
            .map(c => c.subject)
    )];

    const handleIsGradedChange = (checked: boolean) => {
        setFormField('isGraded', checked);
        if (!checked) {
            setFormField('maxGrade', undefined);
        } else {
            setFormField('maxGrade', 20);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isEditing ? t('homework.edit') : t('homework.create')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Class Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('homework.class')} *
                        </label>
                        <select
                            value={formState.selectedClassId}
                            onChange={(e) => setFormField('selectedClassId', e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                        >
                            <option value="">{t('grades.selectClass')}</option>
                            {teacherClasses.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <Input
                        label={t('homework.form.title')}
                        value={formState.title}
                        onChange={(e) => setFormField('title', e.target.value)}
                        placeholder={t('homework.form.titlePlaceholder')}
                    />

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('homework.subject')}
                        </label>
                        <select
                            value={formState.subject}
                            onChange={(e) => setFormField('subject', e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                        >
                            <option value="">{t('grades.selectSubject')}</option>
                            {availableSubjects.map(subj => (
                                <option key={subj} value={subj}>{subj}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('homework.description')}
                        </label>
                        <textarea
                            value={formState.description}
                            onChange={(e) => setFormField('description', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                            placeholder={t('homework.form.descriptionPlaceholder')}
                        />
                    </div>

                    {/* Due Date */}
                    <Input
                        label={t('homework.dueDate')}
                        type="date"
                        value={formState.dueDate}
                        onChange={(e) => setFormField('dueDate', e.target.value)}
                    />

                    {/* Is Graded Toggle */}
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id="isGraded"
                            checked={formState.isGraded}
                            onChange={(e) => handleIsGradedChange(e.target.checked)}
                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                        />
                        <label htmlFor="isGraded" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('homework.isGraded')}
                        </label>
                    </div>

                    {/* Max Grade - only when isGraded */}
                    {formState.isGraded && (
                        <div className="flex items-center gap-4 pl-6">
                            <div className="flex-1">
                                <Input
                                    label={t('homework.maxGrade')}
                                    type="number"
                                    value={formState.maxGrade?.toString() || '20'}
                                    onChange={(e) => setFormField('maxGrade', e.target.value ? parseInt(e.target.value) : 20)}
                                    min={1}
                                    max={100}
                                />
                            </div>
                        </div>
                    )}

                    {/* Allow Online Submission */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="allowOnline"
                            checked={formState.allowOnlineSubmission}
                            onChange={(e) => setFormField('allowOnlineSubmission', e.target.checked)}
                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                        />
                        <label htmlFor="allowOnline" className="text-sm text-gray-700 dark:text-gray-300">
                            {t('homework.allowOnlineSubmission')}
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="primary" onClick={onSubmit}>
                            {isEditing ? t('common.save') : t('homework.create')}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

export default HomeworkForm;
