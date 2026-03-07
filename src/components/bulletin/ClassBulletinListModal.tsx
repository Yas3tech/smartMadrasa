import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Printer, Eye } from 'lucide-react';
import type { Student, AcademicPeriod, Course, Grade, TeacherComment } from '../../types';
import BulletinPreview from './BulletinPreview';
import { generateClassBulletinPDF } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';
import { usePerformance } from '../../context/DataContext';

interface ClassBulletinListModalProps {
  classId: string;
  className: string;
  period: AcademicPeriod;
  students: Student[];
  courses: Course[];
  grades: Grade[];
  comments: TeacherComment[];
  onClose: () => void;
}

const ClassBulletinListModal: React.FC<ClassBulletinListModalProps> = ({
  className,
  period,
  students,
  courses,
  grades,
  comments,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const { attendance } = usePerformance();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const copy = i18n.language.startsWith('nl')
    ? {
        title: 'Rapporten van {{className}}',
        printAll: 'Alles afdrukken',
        viewBulletin: 'Rapport bekijken',
        downloadStarted: 'Download gestart',
      }
    : i18n.language.startsWith('ar')
      ? {
          title: 'كشوف {{className}}',
          printAll: 'طباعة الكل',
          viewBulletin: 'عرض الكشف',
          downloadStarted: 'بدأ التنزيل',
        }
      : {
          title: 'Bulletins de {{className}}',
          printAll: 'Tout imprimer',
          viewBulletin: 'Voir le bulletin',
          downloadStarted: 'Telechargement commence',
        };

  const getStudentAbsences = (studentId: string) => {
    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);

    const studentAttendance = attendance.filter((a) => {
      if (a.studentId !== studentId) return false;
      const recordDate = new Date(a.date);
      return recordDate >= periodStart && recordDate <= periodEnd;
    });

    const justified = studentAttendance.filter(
      (a) => a.status === 'absent' && a.isJustified === true
    ).length;
    const unjustified = studentAttendance.filter(
      (a) => a.status === 'absent' && a.isJustified !== true
    ).length;
    const late = studentAttendance.filter((a) => a.status === 'late').length;

    return { justified, unjustified, late };
  };

  const handlePrintAll = () => {
    const bulletinDataList = students.map((student) => {
      const absences = getStudentAbsences(student.id);

      return {
        student,
        period,
        courses,
        grades,
        comments,
        absences,
      };
    });

    const doc = generateClassBulletinPDF(bulletinDataList, className, period.name);
    doc.save(`Bulletins_${className}_${period.name}.pdf`);
    toast.success(copy.downloadStarted);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {copy.title.replace('{{className}}', className)}
            </h2>
            <p className="text-sm text-gray-500">{period.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintAll}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Printer size={18} />
              {copy.printAll}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={t('common.close')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{student.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(student)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  title={copy.viewBulletin}
                >
                  <Eye size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedStudent && (
        <BulletinPreview
          student={selectedStudent}
          period={period}
          courses={courses}
          grades={grades}
          comments={comments}
          absences={getStudentAbsences(selectedStudent.id)}
          className={className}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default ClassBulletinListModal;
