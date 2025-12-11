import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useBulletinGrades } from '../../hooks/useBulletinGrades';
import { MessageSquare, Save, BookOpen, ArrowLeft, TrendingUp, CheckCircle, Users, CheckSquare } from 'lucide-react';

const TeacherBulletinGrades: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const isRTL = i18n.language === 'ar';
    const locale = i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'nl' ? 'nl-NL' : 'fr-FR';

    const {
        selectedPeriod, setSelectedPeriod,
        selectedClassId, setSelectedClassId,
        selectedStudent, setSelectedStudent,
        comments, setComments,
        academicPeriods, teacherClasses, classStudents,
        selectedPeriodData, selectedClassData, selectedStudentData,
        classValidationStats, studentCourseAverages, overallAverage,
        classComments,
        handleSaveComment, handleValidateAll, handleValidateStudentBulletin
    } = useBulletinGrades();

    // Access check
    if (user?.role !== 'teacher') {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">{t('bulletinGrades.restrictedAccess')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('bulletinGrades.title')}</h1>
                <p className="text-gray-600 dark:text-slate-400 mt-2">{t('bulletinGrades.subtitle')}</p>
            </div>

            {/* Step 1: Select Period */}
            {!selectedPeriod && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 dark:text-white">{t('bulletinGrades.step1')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {academicPeriods.map(period => (
                            <button
                                key={period.id}
                                onClick={() => setSelectedPeriod(period.id)}
                                className="p-6 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all text-left"
                            >
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white">{period.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-slate-400">{period.academicYear}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                                    {t('bulletinGrades.fromTo', {
                                        from: new Date(period.startDate).toLocaleDateString(locale),
                                        to: new Date(period.endDate).toLocaleDateString(locale)
                                    })}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Select Class */}
            {selectedPeriod && !selectedClassId && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <button onClick={() => setSelectedPeriod('')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-700 dark:text-slate-300">
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-xl font-semibold dark:text-white">{t('bulletinGrades.step2')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teacherClasses.map(cls => (
                            <button
                                key={cls.id}
                                onClick={() => setSelectedClassId(cls.id)}
                                className="p-6 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all text-left flex items-center gap-4"
                            >
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 dark:text-indigo-400">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{cls.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">{cls.grade}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Class Overview */}
            {selectedPeriod && selectedClassId && !selectedStudent && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSelectedClassId('')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-700 dark:text-slate-300 flex-shrink-0">
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="min-w-0">
                                    <h2 className="text-xl font-semibold dark:text-white truncate">{selectedClassData?.name} - {t('bulletinGrades.overview')}</h2>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{selectedPeriodData?.name}</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg flex justify-between items-center sm:block text-right">
                                    <span className="text-sm text-gray-500 sm:hidden">{t('bulletinGrades.validationProgress')}</span>
                                    <div>
                                        <p className="text-xs text-gray-500 hidden sm:block">{t('bulletinGrades.validationProgress')}</p>
                                        <p className="font-bold text-indigo-600">
                                            {classValidationStats.validated} / {classValidationStats.total}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleValidateAll}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <CheckSquare size={18} />
                                    {t('bulletinGrades.validateAll')}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {classStudents.map(student => {
                                const studentComments = classComments.filter(c => c.studentId === student.id && c.periodId === selectedPeriod);
                                // Note: In the hook we calculate complexity, here we just need to display.
                                // But wait, to show 'isFullyValidated', we need data.
                                // The hook's classValidationStats gives global stats.
                                // For individual student button color, we need per-student stats.
                                // I'll reimplement simple check here or update hook to return this map?
                                // Let's reimplement simple UI check or assume all if global is done? No.
                                // Reimplementing minimal logic for UI display:
                                const validatedCount = studentComments.filter(c => c.isValidated).length;
                                // We don't have totalCourses per student easily here without recalculating.
                                // I will skip the precise count display for now or just check if *any* validated comments match expected count?
                                // Let's just use validatedCount for now.
                                return (
                                    <button
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student.id)}
                                        className="p-4 border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-medium text-gray-800">{student.name}</p>
                                            {validatedCount > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-green-600">
                                                    <CheckCircle size={12} /> {validatedCount} {t('bulletinGrades.validated')}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Student Detail */}
            {selectedPeriod && selectedStudent && (
                <>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedStudent('')}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <ArrowLeft size={20} className="text-gray-700 dark:text-slate-300" />
                                </button>
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                                    {selectedStudentData?.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white truncate">{selectedStudentData?.name}</h2>
                                    <p className="text-gray-600 dark:text-slate-400 truncate">{selectedPeriodData?.name} - {selectedPeriodData?.academicYear}</p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-6 text-white w-full lg:w-auto">
                                <div className="flex items-center justify-between lg:block">
                                    <span className="text-indigo-100 text-sm lg:mb-1 block">{t('bulletinGrades.generalAverage')}</span>
                                    <div className="flex items-baseline gap-1 lg:block">
                                        <span className="text-4xl font-bold">{overallAverage.toFixed(2)}</span>
                                        <span className="text-indigo-100 text-sm">/ 20</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {studentCourseAverages.length === 0 ? (
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
                                <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500 dark:text-slate-400">{t('bulletinGrades.noGradesForPeriod')}</p>
                            </div>
                        ) : (
                            studentCourseAverages.map(({ course, gradeCount, average, existingComment }) => (
                                <div key={course.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                <BookOpen size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{course.subject}</h3>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">{gradeCount} {gradeCount > 1 ? t('bulletinGrades.grades') : t('bulletinGrades.grade')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 px-6 py-3 rounded-lg">
                                            <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{average.toFixed(2)}</p>
                                                <p className="text-xs text-green-600 dark:text-green-500">/ 20</p>
                                            </div>
                                        </div>
                                    </div>

                                    {existingComment && existingComment.isValidated ? (
                                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                                                    {t('bulletinGrades.commentValidated')} ✓
                                                </p>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300">{existingComment.comment}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                {t('bulletinGrades.validatedOn', { date: new Date(existingComment.validationDate!).toLocaleDateString(locale) })}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-gray-700">
                                                <MessageSquare size={16} className="inline mr-2" />
                                                {existingComment ? t('bulletinGrades.editComment') : t('bulletinGrades.addComment')}
                                            </label>

                                            <textarea
                                                value={comments[course.id] !== undefined ? comments[course.id] : (existingComment?.comment || '')}
                                                onChange={(e) => setComments(prev => ({ ...prev, [course.id]: e.target.value }))}
                                                rows={3}
                                                placeholder={t('bulletinGrades.commentPlaceholder')}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <button
                                                onClick={() => handleSaveComment(course.id)}
                                                disabled={
                                                    (comments[course.id] !== undefined && !comments[course.id].trim()) ||
                                                    (comments[course.id] === undefined && !existingComment)
                                                }
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                <Save size={18} />
                                                {existingComment ? t('bulletinGrades.update') : t('common.save')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleValidateStudentBulletin}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
                        >
                            <CheckSquare size={20} />
                            {t('bulletinGrades.validateBulletinFor', { name: selectedStudentData?.name })}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default TeacherBulletinGrades;
