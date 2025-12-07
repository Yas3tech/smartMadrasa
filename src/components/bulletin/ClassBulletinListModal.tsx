import React, { useState } from 'react';
import { X, Printer, Eye } from 'lucide-react';
import type { Student, AcademicPeriod, Course, Grade, TeacherComment } from '../../types';
import BulletinPreview from './BulletinPreview';
import { generateClassBulletinPDF } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

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
    onClose
}) => {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const handlePrintAll = () => {
        const bulletinDataList = students.map(student => {
            // Mock absences for now as they are not yet in context
            // In real app, fetch from Attendance or ReportCard
            const absences = { justified: 0, unjustified: 0, late: 0 };

            return {
                student,
                period,
                courses,
                grades,
                comments,
                absences
            };
        });

        const doc = generateClassBulletinPDF(bulletinDataList, className, period.name);
        doc.save(`Bulletins_${className}_${period.name}.pdf`);
        toast.success('Téléchargement commencé');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Bulletins - {className}</h2>
                        <p className="text-sm text-gray-500">{period.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrintAll}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Printer size={18} />
                            Tout Imprimer
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map(student => (
                            <div key={student.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
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
                                    title="Voir le bulletin"
                                >
                                    <Eye size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Individual Bulletin Preview Modal */}
            {selectedStudent && (
                <BulletinPreview
                    student={selectedStudent}
                    period={period}
                    courses={courses}
                    grades={grades}
                    comments={comments}
                    absences={{ justified: 0, unjustified: 0, late: 0 }} // Mock for now
                    onClose={() => setSelectedStudent(null)}
                />
            )}
        </div>
    );
};

export default ClassBulletinListModal;
