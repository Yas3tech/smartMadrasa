import { useTranslation } from 'react-i18next';
import { Button } from '../UI';
import {
  Search,
  Upload,
  Pencil,
  X,
  Check,
  Plus,
  ArrowLeft,
  User,
  BookOpen,
  Users,
} from 'lucide-react';
import BulkGradeModal from './BulkGradeModal';
import GradeModal from './GradeModal';
import { useTeacherGrades } from '../../hooks/useTeacherGrades';

const TeacherGradesView = () => {
  const { t } = useTranslation();
  const tg = useTeacherGrades();

  return (
    <div className="space-y-6">
      {/* Header - Always visible */}
      {/* Mobile Header */}
      <div className="lg:hidden -mx-4 -mt-6 bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-b-[2rem] shadow-lg mb-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-white/90" size={24} />
            {tg.selectedClass ? `${tg.selectedClass.name} - ` : ''}
            {t('grades.management')}
          </h1>
          <button
            onClick={() => tg.setIsBulkModalOpen(true)}
            disabled={!tg.selectedClassId}
            className={`p-2 rounded-lg bg-orange-700/30 backdrop-blur-md border border-white/20 ${!tg.selectedClassId ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 transition-transform'}`}
          >
            <Upload size={20} />
          </button>
        </div>
        <p className="text-orange-100 text-sm mb-4 opacity-90">{t('grades.teacherSubtitle')}</p>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('grades.management')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{t('grades.teacherSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => tg.setIsBulkModalOpen(true)}
            disabled={!tg.selectedClassId}
          >
            {t('grades.addBulkGrades')}
          </Button>
        </div>
      </div>

      {/* Step 1: Class Selection */}
      {!tg.selectedClassId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tg.teacherClasses.map((cls) => (
            <button
              key={cls.id}
              onClick={() => tg.setSelectedClassId(cls.id)}
              className="group p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-900 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
                  <Users size={24} />
                </div>
                <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs rounded-full font-medium">
                  {cls.grade}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {cls.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('grades.selectClass')}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: View Mode Selection */}
      {tg.selectedClassId && !tg.viewMode && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <button
              onClick={tg.goBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-gray-600 dark:text-slate-300" size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {tg.selectedClass?.name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{t('grades.chooseView')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => tg.setViewMode('byStudent')}
              className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-gray-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-900 transition-all flex flex-col items-center text-center gap-4 group"
            >
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <User size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {t('grades.viewByStudent')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {t('grades.viewByStudentDesc')}
                </p>
              </div>
            </button>

            <button
              onClick={() => tg.setViewMode('bySubject')}
              className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-gray-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-900 transition-all flex flex-col items-center text-center gap-4 group"
            >
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <BookOpen size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {t('grades.viewBySubject')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {t('grades.viewBySubjectDesc')}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 3a: Student Selection & Grades */}
      {tg.viewMode === 'byStudent' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={tg.goBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="text-gray-600 dark:text-slate-300" size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {tg.selectedStudentData ? tg.selectedStudentData.name : t('grades.studentList')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">{tg.selectedClass?.name}</p>
              </div>
            </div>
            {!tg.selectedStudentId && (
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={tg.searchTerm}
                  onChange={(e) => tg.setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-orange-500/20 outline-none w-64"
                />
              </div>
            )}
            {tg.selectedStudentId && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => tg.setIsGradeModalOpen(true)}
              >
                {t('grades.addGrade')}
              </Button>
            )}
          </div>

          {!tg.selectedStudentId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tg.filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => tg.setSelectedStudentId(student.id)}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl hover:shadow-md transition-all border border-gray-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-900 text-left group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{student.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{student.email}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-300">
                        {t('grades.subject')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-300">
                        {t('grades.score')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-300">
                        {t('grades.type')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-300">
                        {t('grades.date')}
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600 dark:text-slate-300">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {tg.studentGrades.map((grade) => (
                      <tr
                        key={grade.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {grade.subject}
                        </td>
                        <td className="px-6 py-4">
                          {tg.editingGrade?.id === grade.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={tg.editValue}
                                onChange={(e) => tg.setEditValue(e.target.value)}
                                className="w-20 px-2 py-1 border rounded bg-white dark:bg-slate-800"
                                step="0.5"
                                min="0"
                                max={grade.maxScore}
                              />
                              <span className="text-gray-500">/{grade.maxScore}</span>
                            </div>
                          ) : (
                            <span
                              className={`font-bold ${grade.score < grade.maxScore / 2 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}
                            >
                              {grade.score}/{grade.maxScore}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              grade.type === 'exam'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : grade.type === 'homework'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {t(`grades.${grade.type}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                          {new Date(grade.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {tg.editingGrade?.id === grade.id ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={tg.handleUpdateGrade}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={tg.cancelEditing}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => tg.startEditingGrade(grade)}
                              className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                            >
                              <Pencil size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3b: Subject Selection & Grades */}
      {tg.viewMode === 'bySubject' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <button
              onClick={tg.goBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-gray-600 dark:text-slate-300" size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {tg.selectedSubject || t('grades.selectSubject')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{tg.selectedClass?.name}</p>
            </div>
          </div>

          {!tg.selectedSubject ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tg.classSubjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => tg.setSelectedSubject(subject)}
                  className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-gray-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-900 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{subject}</h3>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-300">
                        {t('grades.student')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-300">
                        {t('grades.score')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-300">
                        {t('grades.type')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-300">
                        {t('grades.date')}
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600 dark:text-slate-300">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {tg.subjectGrades.map((grade) => {
                      const student = tg.filteredStudents.find((s) => s.id === grade.studentId);
                      return (
                        <tr
                          key={grade.id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            {student?.name || t('common.unknown')}
                          </td>
                          <td className="px-6 py-4">
                            {tg.editingGrade?.id === grade.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={tg.editValue}
                                  onChange={(e) => tg.setEditValue(e.target.value)}
                                  className="w-20 px-2 py-1 border rounded bg-white dark:bg-slate-800"
                                  step="0.5"
                                  min="0"
                                  max={grade.maxScore}
                                />
                                <span className="text-gray-500">/{grade.maxScore}</span>
                              </div>
                            ) : (
                              <span
                                className={`font-bold ${grade.score < grade.maxScore / 2 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}
                              >
                                {grade.score}/{grade.maxScore}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                grade.type === 'exam'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  : grade.type === 'homework'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {t(`grades.${grade.type}`)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                            {new Date(grade.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {tg.editingGrade?.id === grade.id ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={tg.handleUpdateGrade}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={tg.cancelEditing}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => tg.startEditingGrade(grade)}
                                className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                              >
                                <Pencil size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <BulkGradeModal
        isOpen={tg.isBulkModalOpen}
        onClose={() => tg.setIsBulkModalOpen(false)}
        className={tg.selectedClass?.name || ''}
        onSave={tg.handleBulkSave}
        students={tg.filteredStudents}
        availableSubjects={tg.classSubjects}
      />

      <GradeModal
        isOpen={tg.isGradeModalOpen}
        onClose={() => tg.setIsGradeModalOpen(false)}
        onSave={tg.handleIndividualGradeSave}
        editingGrade={tg.editingGrade}
        classId={tg.selectedClassId}
        availableSubjects={tg.classSubjects}
      />
    </div>
  );
};

export default TeacherGradesView;
