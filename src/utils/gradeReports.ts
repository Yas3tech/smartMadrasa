import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import type { Grade, Student } from '../types';

interface Stats {
    avgGrade: number;
    attendanceRate: number;
}

export const generateGradeReport = (
    student: Student,
    grades: Grade[],
    stats: Stats,
    t: (key: string) => string,
    language: string
) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(234, 88, 12); // Orange
    doc.text('SmartMadrassa', 20, 20);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(t('grades.academicReport'), 20, 35);

    // Student Info
    doc.setFontSize(12);
    doc.text(`${t('common.name')}: ${student.name}`, 20, 50);
    doc.text(`${t('common.date')}: ${new Date().toLocaleDateString(language)}`, 20, 60);

    // Stats
    doc.text(`${t('grades.generalAverage')}: ${stats.avgGrade}%`, 20, 70);
    doc.text(`${t('grades.attendanceRate')}: ${stats.attendanceRate}%`, 20, 80);

    // Grades Table
    const studentGrades = grades.filter(g => g.studentId === student.id);
    const tableData = studentGrades.map(grade => [
        grade.subject,
        grade.type === 'exam' ? t('grades.exam') : grade.type === 'homework' ? t('grades.homework') : t('grades.participation'),
        `${grade.score}/${grade.maxScore}`,
        new Date(grade.date).toLocaleDateString(language)
    ]);

    autoTable(doc, {
        startY: 90,
        head: [[t('grades.subject'), t('grades.type'), t('grades.score'), t('grades.date')]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [234, 88, 12] },
    });

    doc.save(`bulletin_${student.name.replace(/\s+/g, '_')}.pdf`);
    toast.success(t('grades.reportDownloaded'));
};
