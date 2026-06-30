import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Users, CheckCircle, Filter } from 'lucide-react';
import type { Attendance, Student, Course, ClassGroup } from '../../types';

interface DirectorAttendanceViewProps {
  students: Student[];
  attendance: Attendance[];
  courses: Course[];
  classes: ClassGroup[];
}

const DirectorAttendanceView: React.FC<DirectorAttendanceViewProps> = ({
  students,
  attendance,
  courses,
  classes,
}) => {
  const { t } = useTranslation();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _courses = courses;

  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  const filteredStudents = useMemo(() => {
    if (selectedClassId) return students.filter((s) => s.classId === selectedClassId);
    return students;
  }, [students, selectedClassId]);

  const filteredAttendance = useMemo(() => {
    let records = attendance.filter((a) => a.status !== 'present');
    if (selectedClassId) records = records.filter((a) => a.classId === selectedClassId);
    if (dateFrom) records = records.filter((a) => a.date >= dateFrom);
    if (dateTo) records = records.filter((a) => a.date <= dateTo);
    return records;
  }, [attendance, selectedClassId, dateFrom, dateTo]);

  const studentStats = useMemo(() => {
    const statsMap: Record<
      string,
      {
        student: Student;
        absences: number;
        late: number;
        justified: number;
        unjustified: number;
      }
    > = {};

    filteredStudents.forEach((s) => {
      statsMap[s.id] = { student: s, absences: 0, late: 0, justified: 0, unjustified: 0 };
    });

    filteredAttendance.forEach((record) => {
      const entry = statsMap[record.studentId];
      if (!entry) return;
      if (record.status === 'absent') entry.absences++;
      if (record.status === 'late') entry.late++;
      if (record.isJustified) entry.justified++;
      else entry.unjustified++;
    });

    return Object.values(statsMap)
      .filter((s) => s.absences + s.late > 0)
      .sort((a, b) => b.absences + b.late - (a.absences + a.late));
  }, [filteredStudents, filteredAttendance]);

  const totals = useMemo(
    () => ({
      absences: studentStats.reduce((sum, s) => sum + s.absences, 0),
      late: studentStats.reduce((sum, s) => sum + s.late, 0),
      justified: studentStats.reduce((sum, s) => sum + s.justified, 0),
      unjustified: studentStats.reduce((sum, s) => sum + s.unjustified, 0),
    }),
    [studentStats]
  );

  const handleExportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(t('attendance.overview'));

    sheet.columns = [
      { header: t('common.student'), key: 'name', width: 28 },
      { header: t('common.class'), key: 'class', width: 20 },
      { header: t('attendance.absent'), key: 'absences', width: 14 },
      { header: t('attendance.late'), key: 'late', width: 14 },
      { header: t('attendance.justified'), key: 'justified', width: 16 },
      { header: t('attendance.notJustified'), key: 'unjustified', width: 20 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    headerRow.height = 22;

    studentStats.forEach(({ student, absences, late, justified, unjustified }) => {
      const cls = classMap.get(student.classId);
      const row = sheet.addRow({
        name: student.name,
        class: cls?.name || '-',
        absences,
        late,
        justified,
        unjustified,
      });
      row.getCell('absences').alignment = { horizontal: 'center' };
      row.getCell('late').alignment = { horizontal: 'center' };
      row.getCell('justified').alignment = { horizontal: 'center' };
      row.getCell('unjustified').alignment = { horizontal: 'center' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `absences_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <Filter size={18} className="text-gray-400 self-center" />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-slate-400">
            {t('common.class')}
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">{t('common.all')}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-slate-400">
            {t('attendance.dateFrom')}
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-slate-400">
            {t('attendance.dateTo')}
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
          />
        </div>

        <button
          onClick={handleExportExcel}
          disabled={studentStats.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto text-sm font-medium"
        >
          <Download size={16} />
          {t('attendance.exportExcel')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">
            {t('attendance.absent')}
          </p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{totals.absences}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wide">
            {t('attendance.late')}
          </p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{totals.late}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-green-500 uppercase tracking-wide">
            {t('attendance.justified')}
          </p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{totals.justified}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">
            {t('attendance.notJustified')}
          </p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {totals.unjustified}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
          <Users size={20} className="text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('attendance.absenceOverview')}
          </h2>
          <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">
            {studentStats.length} {t('attendance.students')}
          </span>
        </div>

        {studentStats.length === 0 ? (
          <div className="p-16 text-center">
            <CheckCircle size={52} className="mx-auto text-green-400 mb-4" />
            <p className="text-gray-500 dark:text-slate-400 text-lg font-medium">
              {t('attendance.noAbsences')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    {t('common.student')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    {t('common.class')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-red-500 uppercase tracking-wide">
                    {t('attendance.absent')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-yellow-500 uppercase tracking-wide">
                    {t('attendance.late')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-green-500 uppercase tracking-wide">
                    {t('attendance.justified')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-orange-500 uppercase tracking-wide">
                    {t('attendance.notJustified')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {studentStats.map(({ student, absences, late, justified, unjustified }) => {
                  const cls = classMap.get(student.classId);
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-sm">
                        {cls?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {absences > 0 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full font-bold text-sm">
                            {absences}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {late > 0 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-full font-bold text-sm">
                            {late}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {justified > 0 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full font-bold text-sm">
                            {justified}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {unjustified > 0 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full font-bold text-sm">
                            {unjustified}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectorAttendanceView;
