import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button, Modal, Input } from '../../components/UI';
import { Plus, Edit2, Users, GraduationCap, X, UserPlus, UserMinus, Search } from 'lucide-react';
import type { ClassGroup, Student } from '../../types';
import { updateUser } from '../../services/users';
import toast from 'react-hot-toast';

const Classes = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { classes, users, students, addClass, updateClass, deleteClass } = useData();
  const isRTL = i18n.language === 'ar';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassGroup | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [managingClass, setManagingClass] = useState<ClassGroup | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const teachers = users.filter((u) => u.role === 'teacher');

  const handleOpenNew = () => {
    setEditingClass(null);
    setName('');
    setGrade('');
    setTeacherId('');
    setIsModalOpen(true);
  };

  const handleEdit = (classGroup: ClassGroup) => {
    setEditingClass(classGroup);
    setName(classGroup.name);
    setGrade(classGroup.grade);
    setTeacherId(classGroup.teacherId || '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !grade) return;

    if (editingClass) {
      await updateClass(editingClass.id, { name, grade, teacherId });
    } else {
      const newClass: ClassGroup = {
        id: `c${Date.now()}`,
        name,
        grade,
        teacherId,
      };
      await addClass(newClass);
    }
    setIsModalOpen(false);
  };

  const getClassTeacher = (teacherId: string) => {
    return users.find((u) => u.id === teacherId);
  };

  const getClassStudents = (classId: string) => {
    return students.filter((s) => (s as Student).classId === classId);
  };

  const handleManageStudents = (classGroup: ClassGroup) => {
    setManagingClass(classGroup);
    setStudentSearch('');
    setIsStudentModalOpen(true);
  };

  const handleAddStudentToClass = async (studentId: string) => {
    if (!managingClass) return;
    try {
      // classId is specific to Student type, so we cast the update
      await updateUser(studentId, { classId: managingClass.id } as Partial<Student>);
      toast.success(t('classes.studentAdded'));
    } catch (error) {
      console.error('Error adding student to class:', error);
      toast.error(t('classes.studentAddError'));
    }
  };

  const handleRemoveStudentFromClass = async (studentId: string) => {
    try {
      // classId is specific to Student type, so we cast the update
      await updateUser(studentId, { classId: '' } as Partial<Student>);
      toast.success(t('classes.studentRemoved'));
    } catch (error) {
      console.error('Error removing student from class:', error);
      toast.error(t('classes.studentRemoveError'));
    }
  };

  // Get students available to add (only those WITHOUT a class)
  const getAvailableStudents = () => {
    if (!managingClass) return [];
    return students.filter((s) => {
      const student = s as Student;
      // Only show students who don't have a class assigned
      const hasNoClass = !student.classId || student.classId === '';
      const matchesSearch =
        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.email.toLowerCase().includes(studentSearch.toLowerCase());
      return hasNoClass && (studentSearch === '' || matchesSearch);
    });
  };

  if (user?.role !== 'teacher' && user?.role !== 'director' && user?.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 text-center">
          <GraduationCap size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('classes.restrictedAccess')}</h2>
          <p className="text-gray-600">{t('classes.restrictedAccessDesc')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('classes.title')}</h1>
        <Button variant="primary" icon={Plus} onClick={handleOpenNew}>
          {t('classes.newClass')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <GraduationCap className="text-orange-600" size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('classes.totalClasses')}</p>
              <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="text-blue-600" size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('classes.totalStudents')}</p>
              <p className="text-3xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <GraduationCap className="text-green-600" size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('classes.teachers')}</p>
              <p className="text-3xl font-bold text-gray-900">{teachers.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classGroup) => {
          const teacher = getClassTeacher(classGroup.teacherId || '');
          const classStudents = getClassStudents(classGroup.id);

          return (
            <Card key={classGroup.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{classGroup.name}</h3>
                  <p className="text-sm text-gray-500">{classGroup.grade}</p>
                </div>
                <button
                  onClick={() => handleEdit(classGroup)}
                  className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Teacher */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {teacher ? teacher.name.charAt(0) : '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{t('classes.teacher')}</p>
                    <p className="font-semibold text-sm text-gray-900">
                      {teacher ? teacher.name : t('classes.notAssigned')}
                    </p>
                  </div>
                </div>

                {/* Students Count - Clickable */}
                <button
                  onClick={() => handleManageStudents(classGroup)}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="text-blue-600" size={18} />
                    <span className="text-sm font-medium text-gray-700">
                      {t('classes.students')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-blue-600">{classStudents.length}</span>
                    <UserPlus size={16} className="text-blue-400" />
                  </div>
                </button>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(classGroup)}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingClass(classGroup);
                    }}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingClass ? t('classes.editClass') : t('classes.newClass')}
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <Input
              label={t('classes.className')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Classe 1A"
            />

            <Input
              label={t('classes.grade')}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="1ère année"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('classes.teacher')}
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              >
                <option value="">{t('classes.selectTeacher')}</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handleSave}>
                {editingClass ? t('common.save') : t('classes.create')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Student Management Modal */}
      <Modal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)}>
        <div className="p-6 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('classes.manageStudents')}</h2>
              <p className="text-sm text-gray-500">{managingClass?.name}</p>
            </div>
            <button
              onClick={() => setIsStudentModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Current Students */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users size={16} />
                {t('classes.currentStudents')} (
                {managingClass ? getClassStudents(managingClass.id).length : 0})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {managingClass &&
                  getClassStudents(managingClass.id).map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStudentFromClass(student.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('classes.removeStudent')}
                      >
                        <UserMinus size={18} />
                      </button>
                    </div>
                  ))}
                {managingClass && getClassStudents(managingClass.id).length === 0 && (
                  <p className="text-center text-gray-400 py-4">{t('classes.noStudentsInClass')}</p>
                )}
              </div>
            </div>

            {/* Add Students */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <UserPlus size={16} />
                {t('classes.addStudents')}
              </h3>

              {/* Search */}
              <div className="relative mb-3">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder={t('classes.searchStudents')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getAvailableStudents()
                  .slice(0, 20)
                  .map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddStudentToClass(student.id)}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title={t('classes.addStudent')}
                      >
                        <UserPlus size={18} />
                      </button>
                    </div>
                  ))}
                {getAvailableStudents().length === 0 && (
                  <p className="text-center text-gray-400 py-4">
                    {studentSearch
                      ? t('classes.noMatchingStudents')
                      : t('classes.allStudentsAssigned')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t mt-4">
            <Button variant="primary" onClick={() => setIsStudentModalOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingClass} onClose={() => setDeletingClass(null)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('classes.confirmDelete')}</h2>
              <p className="text-sm text-gray-500">{t('classes.actionIrreversible')}</p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            {t('classes.deleteConfirmMessage', { name: deletingClass?.name })}
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeletingClass(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (deletingClass) {
                  await deleteClass(deletingClass.id);
                  setDeletingClass(null);
                }
              }}
            >
              {t('classes.deletePermanently')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Classes;
