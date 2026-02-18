import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X } from 'lucide-react';
import type { Student, AcademicPeriod, Course, Grade, TeacherComment } from '../../types';
import { generateStudentBulletinPDF } from '../../utils/pdfGenerator';

interface BulletinPreviewProps {
  student: Student;
  period: AcademicPeriod;
  courses: Course[];
  grades: Grade[];
  comments: TeacherComment[];
  absences: { justified: number; unjustified: number; late: number };
  className?: string;
  onClose?: () => void;
}

const BulletinPreview: React.FC<BulletinPreviewProps> = ({
  student,
  period,
  courses,
  grades,
  comments,
  absences,
  className,
  onClose,
}) => {
  const { t } = useTranslation();
  const componentRef = useRef<HTMLDivElement>(null);

  // Calculate averages for display - group by subject to avoid duplicates
  const coursesBySubject = courses.reduce(
    (acc, course) => {
      if (!acc[course.subject]) {
        acc[course.subject] = [];
      }
      acc[course.subject].push(course);
      return acc;
    },
    {} as Record<string, typeof courses>
  );

  const courseData = Object.entries(coursesBySubject).map(([subject, subjectCourses]) => {
    // Get all grades for this student across all courses with this subject
    const allPeriodGrades = subjectCourses.flatMap((course) => {
      const courseGrades = grades.filter(
        (g) => g.studentId === student.id && g.courseId === course.id
      );
      return courseGrades.filter((g) => {
        const d = new Date(g.date);
        return d >= new Date(period.startDate) && d <= new Date(period.endDate);
      });
    });

    const average =
      allPeriodGrades.length > 0
        ? allPeriodGrades.reduce((acc, g) => acc + g.score, 0) / allPeriodGrades.length
        : null;

    // Get comment for any course with this subject
    const comment =
      subjectCourses
        .map((course) =>
          comments.find(
            (c) =>
              c.courseId === course.id && c.periodId === period.id && c.studentId === student.id
          )
        )
        .find((c) => c)?.comment || '';

    return {
      course: { ...subjectCourses[0], subject }, // Use first course as template
      average,
      comment,
    };
  });

  const overallAverage =
    courseData.length > 0
      ? courseData.reduce((acc, c) => acc + (c.average || 0), 0) /
      courseData.filter((c) => c.average !== null).length
      : 0;

  const handleDownload = () => {
    const doc = generateStudentBulletinPDF({
      student,
      period,
      courses,
      grades,
      comments,
      absences,
      className,
    });
    doc.save(`Bulletin_${student.name}_${period.name}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{t('bulletin.previewTitle')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download size={18} />
              {t('bulletin.downloadPDF')}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50" ref={componentRef}>
          <div className="bg-white shadow-lg p-8 mx-auto max-w-[210mm] min-h-[297mm]">
            {/* Bulletin Header */}
            <div className="text-center mb-8 border-b pb-4">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('bulletin.schoolName')}</h1>
              <h2 className="text-xl text-gray-600">{t('bulletin.reportCard')}</h2>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">
                  {t('bulletin.student')}
                </h3>
                <p>
                  <span className="text-gray-500">{t('bulletin.studentName')} :</span>{' '}
                  <span className="font-medium">{student.name}</span>
                </p>
                <p>
                  <span className="text-gray-500">{t('bulletin.studentClass')} :</span>{' '}
                  <span className="font-medium">{className || student.className || 'N/A'}</span>
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">
                  {t('bulletin.period')}
                </h3>
                <p>
                  <span className="text-gray-500">{t('bulletin.periodName')} :</span>{' '}
                  <span className="font-medium">{period.name}</span>
                </p>
                <p>
                  <span className="text-gray-500">{t('bulletin.periodYear')} :</span>{' '}
                  <span className="font-medium">{period.academicYear}</span>
                </p>
              </div>
            </div>

            {/* Grades Table */}
            <table className="w-full mb-8 border-collapse">
              <thead>
                <tr className="bg-indigo-600 text-white">
                  <th className="p-3 text-left border border-indigo-600">
                    {t('bulletin.subject')}
                  </th>
                  <th className="p-3 text-center border border-indigo-600 w-32">
                    {t('bulletin.average')}
                  </th>
                  <th className="p-3 text-left border border-indigo-600">
                    {t('bulletin.comment')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {courseData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 border border-gray-200 font-medium">
                      {item.course.subject}
                    </td>
                    <td className="p-3 border border-gray-200 text-center font-bold text-gray-800">
                      {item.average !== null ? item.average.toFixed(2) : '-'}
                    </td>
                    <td className="p-3 border border-gray-200 text-sm text-gray-600 italic">
                      {item.comment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer Stats */}
            <div className="flex justify-between items-start mt-8">
              <div className="w-1/2">
                <h3 className="font-bold text-gray-700 mb-2">{t('bulletin.attendance')}</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>
                    • {t('bulletin.justified')} : {absences.justified}
                  </li>
                  <li>
                    • {t('bulletin.unjustified')} : {absences.unjustified}
                  </li>
                  <li>
                    • {t('bulletin.late')} : {absences.late}
                  </li>
                </ul>
              </div>
              <div className="w-64 bg-gray-100 p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-sm text-gray-500 mb-1">{t('bulletin.generalAverage')}</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {overallAverage.toFixed(2)} <span className="text-sm text-gray-400">/ 20</span>
                </p>
              </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between mt-16 pt-8 border-t">
              <div className="text-center w-48">
                <p className="text-sm text-gray-500 mb-8">{t('bulletin.parentSignature')}</p>
                <div className="h-px bg-gray-300 w-full"></div>
              </div>
              <div className="text-center w-48">
                <p className="text-sm text-gray-500 mb-8">{t('bulletin.directorSignature')}</p>
                <div className="h-px bg-gray-300 w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulletinPreview;
