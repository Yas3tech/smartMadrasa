/**
 * User Management Page - Refactored with useUsers hook
 *
 * Uses the useUsers hook for all business logic.
 * Contains UI for user listing, filtering, and CRUD operations.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Modal, Input } from '../../components/UI';
import { Plus, Edit2, Trash2, Search, X, FileSpreadsheet, FileDown } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import type { User, Role } from '../../types';
import toast from 'react-hot-toast';
import { deleteUserWithAllData, previewUserDeletion } from '../../services/users';
import UserImportWizard from '../../components/Users/UserImportWizard';

const UserManagement = () => {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const { users, students, addUser, updateUser } = useUsers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const isRTL = i18n.language === 'ar';

  const isSuperadmin = currentUser?.role === 'superadmin';
  const visibleUsers = useMemo(
    () => (isSuperadmin ? users : users.filter((u) => u.role !== 'superadmin')),
    [users, isSuperadmin]
  );

  const filteredUsers = useMemo(
    () =>
      visibleUsers.filter((u) => {
        const matchesSearch =
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        return matchesSearch && matchesRole;
      }),
    [visibleUsers, searchQuery, filterRole]
  );

  const roleCounts = useMemo(() => {
    const counts = { all: 0, student: 0, teacher: 0, parent: 0, director: 0, superadmin: 0 };
    counts.all = visibleUsers.length;
    visibleUsers.forEach((u) => {
      if (counts[u.role] !== undefined) counts[u.role]++;
    });
    return counts as Record<string, number>;
  }, [visibleUsers]);

  const roleColors: Record<Role, string> = {
    student: 'bg-blue-100 text-blue-700',
    teacher: 'bg-orange-100 text-orange-700',
    parent: 'bg-purple-100 text-purple-700',
    director: 'bg-green-100 text-green-700',
    superadmin: 'bg-red-100 text-red-700',
  };

  const getRoleLabel = (r: Role | 'all') => {
    if (r === 'all') return t('users.total');
    return t(`roles.${r}`);
  };

  const handleOpenNew = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('student');
    setPhone('');
    setBirthDate('');
    setSelectedStudentId('');
    setIsModalOpen(true);
  };

  const handleEdit = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setPhone(u.phone || '');
    setBirthDate(u.birthDate || '');
    if (u.role === 'parent') {
      const parent = u as any;
      setSelectedStudentId(parent.childrenIds?.[0] || '');
    } else {
      setSelectedStudentId('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !email) {
      toast.error(t('users.fillRequired'));
      return;
    }
    const userData: Omit<User, 'id'> & { childrenIds?: string[]; relatedClassIds?: string[] } = {
      name,
      email: email.toLowerCase().trim(),
      role,
      phone: role === 'teacher' || role === 'parent' ? phone : undefined,
      birthDate: role === 'student' ? birthDate : undefined,
      avatar: name.charAt(0).toUpperCase(),
    };
    if (role === 'parent' && selectedStudentId) {
      userData.childrenIds = [selectedStudentId];
      const student = students.find((s) => s.id === selectedStudentId);
      if (student && 'classId' in student) {
        userData.relatedClassIds = [(student as any).classId];
      }
    }
    if (editingUser) {
      updateUser(editingUser.id, userData);
      toast.success(t('users.userUpdated'));
    } else {
      const result = await addUser({ id: `u${Date.now()}`, ...userData });
      if (result && typeof result === 'object' && 'emailSent' in result) {
        if (result.emailSent) {
          toast.success(t('users.userCreatedEmail', { email }), { duration: 5000, icon: '📧' });
        } else if (result.password) {
          toast.success(`${t('users.tempPassword') || 'Mot de passe temporaire'}: ${result.password}`, {
            duration: 30000,
            icon: '🔑',
          });
        } else {
          toast.success(t('users.userCreated'));
        }
      } else {
        toast.success(t('users.userCreated'));
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (userId: string, userRole: Role) => {
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return;
    const preview = await previewUserDeletion(userId, userRole);
    let confirmMessage = `${t('users.confirmDeleteComplete', { name: userToDelete.name })}\n\n`;
    if (preview.collections.length > 0) {
      confirmMessage += `${t('users.dataToDelete')}:\n`;
      preview.collections.forEach((col) => {
        confirmMessage += `- ${col.name}: ${col.count} ${t('users.documents')}\n`;
      });
    }
    confirmMessage += `\n${t('users.actionIrreversible')}`;
    if (confirm(confirmMessage)) {
      try {
        const result = await deleteUserWithAllData(userId, userRole);
        if (result.success) {
          const counts = result.deletedCounts as Record<string, number>;
          const totalDeleted = Object.values(counts).reduce((a, b) => a + b, 0);
          toast.success(t('users.userDeletedComplete', { count: totalDeleted }), { duration: 5000, icon: '🗑️' });
        } else {
          toast.error(t('users.deleteError'));
        }
      } catch {
        toast.error(t('users.deleteError'));
      }
    }
  };

  const handleDownloadTemplate = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const guideSheet = workbook.addWorksheet('Guide');
    guideSheet.columns = [
      { header: 'Section', key: 'section', width: 22 },
      { header: 'Details', key: 'details', width: 85 },
    ];
    guideSheet.addRows([
      {
        section: 'Format',
        details:
          'Colonnes supportees: name, email, role, phone, birthDate, studentEmail. birthDate doit etre au format YYYY-MM-DD.',
      },
      {
        section: 'Roles',
        details: 'Valeurs autorisees: student, teacher, parent, director, superadmin.',
      },
      {
        section: 'Parent',
        details:
          'Pour un parent, studentEmail doit contenir l email d un eleve existant ou present dans le meme import.',
      },
      {
        section: 'Wizard',
        details:
          'Le wizard de l application permet de corriger les cellules en erreur avant creation definitive.',
      },
    ]);

    const ws = workbook.addWorksheet('Template');
    ws.columns = [
      { header: 'name', key: 'name', width: 20 },
      { header: 'email', key: 'email', width: 25 },
      { header: 'role', key: 'role', width: 10 },
      { header: 'phone', key: 'phone', width: 15 },
      { header: 'birthDate', key: 'birthDate', width: 15 },
      { header: 'studentEmail', key: 'studentEmail', width: 25 },
    ];
    ws.addRows([
      {
        name: 'Jean Dupont',
        email: 'jean@school.ma',
        role: 'student',
        phone: '',
        birthDate: '2010-01-01',
        studentEmail: '',
      },
      {
        name: 'Meryem El Idrissi',
        email: 'meryem@school.ma',
        role: 'teacher',
        phone: '+212600000001',
        birthDate: '',
        studentEmail: '',
      },
      {
        name: 'Fatima Dupont',
        email: 'fatima.parent@school.ma',
        role: 'parent',
        phone: '+212600000002',
        birthDate: '',
        studentEmail: 'jean@school.ma',
      },
    ]);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smartmadrassa_users_template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };
  if (currentUser?.role !== 'director' && currentUser?.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('users.restrictedAccess')}</h2>
          <p className="text-gray-600">{t('users.restrictedAccessDesc')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" icon={FileDown} onClick={handleDownloadTemplate}>
            {t('users.downloadTemplate')}
          </Button>
          <Button
            variant="secondary"
            icon={FileSpreadsheet}
            onClick={() => setIsImportWizardOpen(true)}
          >
            Assistant d'import
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenNew}>
            {t('users.newUser')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {(['all', 'student', 'teacher', 'parent', 'director', 'superadmin'] as const)
          .filter((r) => currentUser?.role === 'superadmin' || r !== 'superadmin')
          .map((roleFilterValue) => (
            <Card
              key={roleFilterValue}
              className={`p-4 cursor-pointer transition-all ${filterRole === roleFilterValue ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:shadow-md'}`}
              onClick={() => setFilterRole(roleFilterValue)}
            >
              <p className="text-xs text-gray-500 font-medium mb-1">
                {getRoleLabel(roleFilterValue)}
              </p>
              <p className="text-2xl font-bold text-gray-900">{roleCounts[roleFilterValue]}</p>
            </Card>
          ))}
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search
            className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`}
            size={20}
          />
          <input
            type="text"
            placeholder={t('users.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none`}
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th
                  className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-700`}
                >
                  {t('users.user')}
                </th>
                <th
                  className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-700`}
                >
                  {t('users.email')}
                </th>
                <th
                  className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-700`}
                >
                  {t('users.role')}
                </th>
                <th
                  className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold text-gray-700`}
                >
                  {t('users.info')}
                </th>
                <th
                  className={`px-6 py-4 ${isRTL ? 'text-left' : 'text-right'} text-sm font-semibold text-gray-700`}
                >
                  {t('users.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[user.role]}`}
                    >
                      {t(`roles.${user.role}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.phone && <div>📞 {user.phone}</div>}
                    {user.birthDate && <div>🎂 {user.birthDate}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} gap-2`}>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.role)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={user.id === currentUser?.id}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingUser ? t('users.editUser') : t('users.newUser')}
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('users.role')}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                disabled={!!editingUser}
              >
                <option value="student">{t('roles.student')}</option>
                <option value="teacher">{t('roles.teacher')}</option>
                <option value="parent">{t('roles.parent')}</option>
                <option value="director">{t('roles.director')}</option>
                {currentUser?.role === 'superadmin' && (
                  <option value="superadmin">{t('roles.superadmin')}</option>
                )}
              </select>
            </div>

            <Input
              label={t('users.fullName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
            />
            <Input
              label={t('users.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean.dupont@school.ma"
            />

            {(role === 'teacher' || role === 'parent') && (
              <Input
                label={t('users.phone')}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212 6..."
              />
            )}

            {role === 'student' && (
              <Input
                label={t('users.birthDate')}
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            )}

            {role === 'parent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('users.linkedChild')}
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                >
                  <option value="">{t('users.selectStudent')}</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">{t('users.selectStudentHelp')}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handleSave}>
                {editingUser ? t('common.save') : t('users.create')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <UserImportWizard
        isOpen={isImportWizardOpen}
        onClose={() => setIsImportWizardOpen(false)}
        users={users}
        students={students}
        addUser={addUser}
        canImportSuperadmin={currentUser?.role === 'superadmin'}
      />
    </div>
  );
};

export default UserManagement;
