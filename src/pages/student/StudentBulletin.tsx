import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Download, Calendar, Clock, Eye } from 'lucide-react';
import type { TeacherComment } from '../../types/bulletin';
import type { Student } from '../../types';
import { subscribeToTeacherCommentsByStudent } from '../../services/teacherComments';
import { generateStudentBulletinPDF } from '../../utils/pdfGenerator';
import BulletinPreview from '../../components/bulletin/BulletinPreview';
import toast from 'react-hot-toast';

const StudentBulletin: React.FC = () => {
    const { t } = useTranslation();
    const { academicPeriods, courses, grades, students, attendance, classes } = useData();
    const { user } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [teacherComments, setTeacherComments] = useState<TeacherComment[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    // Role check moved to after hooks
    const canAccess = user?.role === 'student' || user?.role === 'parent';

    // Get student ID - use optional chaining since user might be null at this point
    const studentId = user?.role === 'student' ? user?.id : user?.id; // TODO: For parents, add child selection
    const studentData = students.find(s => s.id === studentId) as Student | undefined;

    // Subscribe to teacher comments for this student
    useEffect(() => {
        if (studentId) {
            const unsubscribe = subscribeToTeacherCommentsByStudent(studentId, (fetchedComments) => {
                setTeacherComments(fetchedComments);
            });
            return () => unsubscribe();
        }
    }, [studentId]);

    const selectedPeriodData = academicPeriods.find(p => p.id === selectedPeriod);

    // Get comments for selected period
    const periodComments = useMemo(() => {
        if (!selectedPeriod) return [];
        return teacherComments.filter(c => c.periodId === selectedPeriod && c.isValidated);
    }, [teacherComments, selectedPeriod]);

    // Get courses for this student
    const studentCourses = useMemo(() => {
        if (!studentData) return [];
        return courses.filter(c => c.classId === (studentData as Student).classId);
    }, [courses, studentData]);

    // Calculate absences for selected period
    const periodAbsences = useMemo(() => {
        if (!selectedPeriod || !selectedPeriodData) return { justified: 0, unjustified: 0, late: 0 };

        const periodAttendance = attendance.filter(a => {
            const date = new Date(a.date);
            return a.studentId === studentId &&
                date >= new Date(selectedPeriodData.startDate) &&
                date <= new Date(selectedPeriodData.endDate);
        });

        return {
            justified: periodAttendance.filter(a => a.status === 'absent' && a.isJustified).length,
            unjustified: periodAttendance.filter(a => a.status === 'absent' && !a.isJustified).length,
            late: periodAttendance.filter(a => a.status === 'late').length
        };
    }, [attendance, studentId, selectedPeriod, selectedPeriodData]);

    // Check if bulletin is published
    const isBulletinPublished = useMemo(() => {
        if (!selectedPeriodData) return false;
        return selectedPeriodData.isPublished && periodComments.length > 0;
    }, [selectedPeriodData, periodComments]);

    const handleDownloadPDF = () => {
        if (!studentData || !selectedPeriodData) return;

        // Find class name
        const studentClass = classes.find(c => c.id === studentData.classId);
        const studentForPDF = {
            ...studentData,
            className: studentClass?.name || 'N/A'
        };

        const doc = generateStudentBulletinPDF({
            student: studentForPDF,
            period: selectedPeriodData,
            courses: studentCourses,
            grades,
            comments: periodComments,
            absences: periodAbsences,
            className: studentClass?.name || 'N/A' // 👈 Added className here
        });

        doc.save(`Bulletin_${studentData.name}_${selectedPeriodData.name}.pdf`);
        toast.success(t('studentBulletin.downloadSuccess'));
    };

    // Role check - must be after all hooks
    if (!canAccess || !user) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">{t('errors.unauthorized')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">{t('bulletin.myBulletins')}</h1>
                <p className="text-gray-600 mt-2">{t('bulletin.subtitle')}</p>
            </div>

            {/* Period Selector */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bulletin.selectPeriod')}
                </label>
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">{t('bulletin.choosePeriod')}</option>
                    {academicPeriods.map((period) => (
                        <option key={period.id} value={period.id}>
                            {period.name} ({period.academicYear})
                        </option>
                    ))}
                </select>
            </div>

            {selectedPeriod && selectedPeriodData && (
                <>
                    {!isBulletinPublished ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <Clock size={64} className="mx-auto text-orange-500 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('bulletin.notAvailable')}</h2>
                            <p className="text-gray-600">
                                {t('bulletin.notAvailableMessage')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Bulletin Actions */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-800">
                                            Bulletin - {selectedPeriodData.name}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {t('bulletin.publishedOn')} {selectedPeriodData.bulletinPublishDate
                                                ? new Date(selectedPeriodData.bulletinPublishDate).toLocaleDateString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowPreview(true)}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                                        >
                                            <Eye size={18} />
                                            {t('bulletin.preview')}
                                        </button>
                                        <button
                                            onClick={handleDownloadPDF}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                        >
                                            <Download size={18} />
                                            {t('bulletin.downloadPDF')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>{t('bulletin.tip')}:</strong> {t('bulletin.tipMessage')}
                                </p>
                            </div>
                        </>
                    )}
                </>
            )}

            {!selectedPeriod && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">{t('bulletin.selectPeriodPrompt')}</p>
                </div>
            )}

            {/* Bulletin Preview Modal */}
            {showPreview && studentData && selectedPeriodData && (
                <BulletinPreview
                    student={studentData}
                    period={selectedPeriodData}
                    courses={studentCourses}
                    grades={grades}
                    comments={periodComments}
                    absences={periodAbsences}
                    className={classes.find(c => c.id === studentData.classId)?.name} // Pass className
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
};

export default StudentBulletin;
