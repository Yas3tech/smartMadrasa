import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Student, AcademicPeriod, Course, Grade, TeacherComment } from '../types';

interface BulletinData {
  student: Student;
  period: AcademicPeriod;
  courses: Course[];
  grades: Grade[];
  comments: TeacherComment[];
  absences: { justified: number; unjustified: number; late: number };
  className?: string;
}

export const generateStudentBulletinPDF = (data: BulletinData): jsPDF => {
  const doc = new jsPDF();
  addBulletinPage(doc, data);
  return doc;
};

export const generateClassBulletinPDF = (
  dataList: BulletinData[],
  className: string,
  _periodName: string
): jsPDF => {
  const doc = new jsPDF();
  // periodName dispo pour le nom de fichier, etc.

  dataList.forEach((data, index) => {
    if (index > 0) {
      doc.addPage();
    }
    addBulletinPage(doc, { ...data, className });
  });

  return doc;
};

const addBulletinPage = (doc: jsPDF, data: BulletinData) => {
  const { student, period, courses, grades, comments, absences, className } = data;

  // Calculate averages - group by subject to avoid duplicates
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
      course: { ...subjectCourses[0], subject },
      average,
      comment,
    };
  });

  const overallAverage =
    courseData.length > 0
      ? courseData.reduce((acc, c) => acc + (c.average || 0), 0) /
      courseData.filter((c) => c.average !== null).length
      : 0;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('SMART MADRASSA', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.text('BULLETIN DE NOTES', 105, 30, { align: 'center' });

  // Student & Period Info
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);

  doc.text(`Élève : ${student.name}`, 20, 50);
  doc.text(`Classe : ${className || 'N/A'}`, 20, 58);

  doc.text(`Période : ${period.name}`, 140, 50);
  doc.text(`Année : ${period.academicYear}`, 140, 58);

  // Grades Table
  const tableData = courseData.map((item) => [
    item.course.subject,
    item.average !== null ? item.average.toFixed(2) + ' / 20' : '-',
    item.comment,
  ]);

  autoTable(doc, {
    startY: 70,
    head: [['Matière', 'Moyenne', 'Appréciation']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 'auto' },
    },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // Footer Stats
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // Overall Average Box
  doc.setFillColor(240, 240, 240);
  doc.rect(140, finalY, 50, 25, 'F');
  doc.setFontSize(10);
  doc.text('Moyenne Générale', 165, finalY + 8, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${overallAverage.toFixed(2)} / 20`, 165, finalY + 18, { align: 'center' });

  // Absences
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Assiduité :', 20, finalY + 8);
  doc.setFontSize(10);
  doc.text(`• Absences justifiées : ${absences.justified}`, 25, finalY + 16);
  doc.text(`• Absences injustifiées : ${absences.unjustified}`, 25, finalY + 22);
  doc.text(`• Retards : ${absences.late}`, 25, finalY + 28);

  // Signatures
  const sigY = finalY + 50;
  doc.line(20, sigY, 80, sigY);
  doc.text('Signature des Parents', 30, sigY + 5);

  doc.line(130, sigY, 190, sigY);
  doc.text('Le Directeur', 150, sigY + 5);
};
