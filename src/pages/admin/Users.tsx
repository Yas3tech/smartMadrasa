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
import type { User, Role, Parent, Student } from '../../types';
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
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

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
    setSelectedStudentIds([]);
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
      const parent = u as Parent;
      setSelectedStudentIds(parent.childrenIds || []);
    } else {
      setSelectedStudentIds([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !email) {
      toast.error(t('users.fillRequired'));
      return;
    }
    const userData: Partial<User> & { childrenIds?: string[]; relatedClassIds?: string[]; phone?: string; birthDate?: string } = {
      name,
      email: email.toLowerCase().trim(),
      role,
      avatar: name.charAt(0).toUpperCase(),
    };
    if (role === 'teacher' || role === 'parent') userData.phone = phone;
    if (role === 'student') userData.birthDate = birthDate;

    if (role === 'parent' && selectedStudentIds.length > 0) {
      userData.childrenIds = selectedStudentIds;
      const relatedClassIds = new Set<string>();
      selectedStudentIds.forEach(id => {
        const student = students.find((s) => s.id === id);
        if (student && 'classId' in student && (student as Student).classId) {
          relatedClassIds.add((student as Student).classId);
        }
      });
      userData.relatedClassIds = Array.from(relatedClassIds);
    }
    try {
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
    } catch (error) {
      const err = error as { code?: string; message?: string };
      console.error('Error saving user:', err);
      if (err?.code === 'auth/email-already-in-use') {
        toast.error(t('users.emailInUse') || "Cette adresse e-mail est déjà utilisée.");
      } else if (err?.code === 'auth/operation-not-allowed') {
        toast.error("L'authentification par email/mot de passe n'est pas activée dans Firebase.");
      } else {
        toast.error(err?.message || t('common.error') || "Une erreur s'est produite.");
      }
    }
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

    // Add styling and better structure to guide
    guideSheet.columns = [
      { header: 'RUBRIQUE', key: 'section', width: 25 },
      { header: 'DIRECTIVES & EXPLICATIONS', key: 'details', width: 100 },
    ];

    guideSheet.addRows([
      {
        section: '1. Format global',
        details: 'Colonnes supportées obligatoires : name, email, role. Colonnes optionnelles : phone, birthDate, studentEmail.',
      },
      {
        section: '2. Format des données',
        details: '- Format Date (birthDate) : YYYY-MM-DD (ex: 2015-05-20).\n- Emails : Doivent être uniques pour chaque utilisateur.',
      },
      {
        section: '3. Rôles autorisés',
        details: 'student (élève), teacher (prof), parent (parent), director (directeur), superadmin (admin total).',
      },
      {
        section: '4. Liaison Parent-Enfant',
        details: 'IMPORTANT : Pour un rôle "parent", la colonne "studentEmail" doit contenir l\'email de l\'élève.\n' +
          '➤ MULTI-ENFANTS : Si un parent a plusieurs enfants, séparez les emails par une VIRGULE.\n' +
          'Exemple : enfant1@ecole.ma, enfant2@ecole.ma',
      },
      {
        section: '5. Notes sur les profs',
        details: 'Ajoutez le numéro de téléphone pour que les parents puissent les contacter via le planning.',
      },
    ]);

    // Apply some styling to header
    guideSheet.getRow(1).font = { bold: true };
    guideSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    const ws = workbook.addWorksheet('Template');
    ws.columns = [
      { header: 'name', key: 'name', width: 25 },
      { header: 'email', key: 'email', width: 30 },
      { header: 'role', key: 'role', width: 12 },
      { header: 'phone', key: 'phone', width: 18 },
      { header: 'birthDate', key: 'birthDate', width: 15 },
      { header: 'studentEmail', key: 'studentEmail', width: 45 },
    ];

    // Examples requested by user (2 students, 1 teacher, 1 parent)
    ws.addRows([
      {
        name: 'Yassine El Amrani',
        email: 'yassine.student@ecole.ma',
        role: 'student',
        phone: '',
        birthDate: '2012-04-12',
        studentEmail: '',
      },
      {
        name: 'Lina Bennani',
        email: 'lina.student@ecole.ma',
        role: 'student',
        phone: '',
        birthDate: '2013-09-25',
        studentEmail: '',
      },
      {
        name: 'Prof. Ahmed Alaoui',
        email: 'alaoui.teacher@ecole.ma',
        role: 'teacher',
        phone: '+212661001122',
        birthDate: '',
        studentEmail: '',
      },
      {
        name: 'Mme. Samira El Amrani',
        email: 'samira.parent@ecole.ma',
        role: 'parent',
        phone: '+212661334455',
        birthDate: '',
        studentEmail: 'yassine.student@ecole.ma, lina.student@ecole.ma',
      },
    ]);

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
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
            {i18n.language.startsWith('nl')
              ? 'Importwizard'
              : i18n.language.startsWith('ar')
                ? 'معالج الاستيراد'
                : "Assistant d'import"}
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
              aria-pressed={filterRole === roleFilterValue}
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
            aria-label={t('users.searchPlaceholder')}
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
                        aria-label={t('common.edit')}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.role)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={user.id === currentUser?.id}
                        aria-label={t('common.delete')}
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
              autoComplete="off"
            />
            <Input
              label={t('users.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean.dupont@school.ma"
              autoComplete="off"
            />

            {(role === 'teacher' || role === 'parent') && (
              <Input
                label={t('users.phone')}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212 6..."
                autoComplete="off"
              />
            )}

            {role === 'student' && (
              <Input
                label={t('users.birthDate')}
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                autoComplete="off"
              />
            )}

            {role === 'parent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('users.linkedChild')}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-xl bg-gray-50">
                  {students.map((student) => (
                    <label key={student.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds(prev => [...prev, student.id]);
                          } else {
                            setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                          }
                        }}
                        className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">
                        {student.name} <span className="text-gray-400 text-xs">({student.email})</span>
                      </span>
                    </label>
                  ))}
                  {students.length === 0 && (
                    <p className="text-sm text-gray-500 italic text-center py-2">{t('users.noStudents') || 'Aucun élève trouvé'}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {i18n.language.startsWith('ar') ? 'يمكنك اختيار عدة طلاب' : i18n.language.startsWith('nl') ? 'U kunt meerdere studenten selecteren' : 'Vous pouvez sélectionner plusieurs élèves'}
                </p>
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
      </Modal >

      <UserImportWizard
        isOpen={isImportWizardOpen}
        onClose={() => setIsImportWizardOpen(false)}
        users={users}
        students={students}
        addUser={addUser}
        canImportSuperadmin={currentUser?.role === 'superadmin'}
      />
    </div >
  );
};

export default UserManagement;
