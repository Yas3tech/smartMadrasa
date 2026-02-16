import { useState, useRef, type ChangeEvent, type RefObject, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { User, Role, Parent } from '../types';
import { utils, writeFile } from 'xlsx';
import { parseUserFile, processNonParentUsers, processParentUsers } from '../utils/userImport';
import toast from 'react-hot-toast';
import { deleteUserWithAllData, previewUserDeletion } from '../services/users';

export interface UseUsersReturn {
  // Modal state
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  editingUser: User | null;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterRole: Role | 'all';
  setFilterRole: (role: Role | 'all') => void;

  // Form state
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  role: Role;
  setRole: (role: Role) => void;
  phone: string;
  setPhone: (phone: string) => void;
  birthDate: string;
  setBirthDate: (date: string) => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;

  // Data
  students: User[];
  filteredUsers: User[];
  roleCounts: Record<Role | 'all', number>;
  roleColors: Record<Role, string>;
  fileInputRef: RefObject<HTMLInputElement | null>;

  // Handlers
  handleOpenNew: () => void;
  handleEdit: (user: User) => void;
  handleSave: () => void;
  handleDelete: (userId: string, userRole: Role) => Promise<void>;
  handleDownloadTemplate: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getRoleLabel: (r: Role | 'all') => string;
}

const roleColors: Record<Role, string> = {
  student: 'bg-blue-100 text-blue-700',
  teacher: 'bg-orange-100 text-orange-700',
  parent: 'bg-purple-100 text-purple-700',
  director: 'bg-green-100 text-green-700',
  superadmin: 'bg-red-100 text-red-700',
};

export function useUsers(): UseUsersReturn {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { users, addUser, updateUser } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Data
  const students = useMemo(() => users.filter((u) => u.role === 'student'), [users]);

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

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPhone(user.phone || '');
    setBirthDate(user.birthDate || '');
    if (user.role === 'parent') {
      const parent = user as Parent;
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
    const userData: Omit<User, 'id'> & { childrenIds?: string[] } = {
      name,
      email: email.toLowerCase().trim(),
      role,
      phone: role === 'teacher' || role === 'parent' ? phone : undefined,
      birthDate: role === 'student' ? birthDate : undefined,
      avatar: name.charAt(0).toUpperCase(),
    };
    if (role === 'parent' && selectedStudentId) {
      userData.childrenIds = [selectedStudentId];
    }
    if (editingUser) {
      updateUser(editingUser.id, userData);
      toast.success(t('users.userUpdated'));
    } else {
      const result = await addUser({ id: `u${Date.now()}`, ...userData });

      // Check if result has emailSent property
      if (result && typeof result === 'object' && 'emailSent' in result) {
        if (result.emailSent) {
          toast.success(t('users.userCreatedEmail', { email }), { duration: 5000, icon: '📧' });
        } else if (result.password) {
          toast(`Email failed. Temporary password: ${result.password}`, { duration: 20000, icon: '⚠️' });
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
          toast.success(t('users.userDeletedComplete', { count: totalDeleted }), {
            duration: 5000,
            icon: '🗑️',
          });
        } else {
          toast.error(t('users.deleteError'));
        }
      } catch (error) {
        toast.error(t('users.deleteError'));
      }
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [['name', 'email', 'role', 'phone', 'birthDate', 'studentEmail']];
    const ws = utils.aoa_to_sheet(headers);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Template');
    utils.sheet_add_json(
      ws,
      [
        {
          name: 'Jean Dupont',
          email: 'jean@school.ma',
          role: 'student',
          phone: '',
          birthDate: '2010-01-01',
          studentEmail: '',
        },
        {
          name: 'Prof. Alami',
          email: 'alami@school.ma',
          role: 'teacher',
          phone: '0611111111',
          birthDate: '',
          studentEmail: '',
        },
        {
          name: 'Karim Tazi',
          email: 'karim@school.ma',
          role: 'parent',
          phone: '0600000000',
          birthDate: '',
          studentEmail: 'jean@school.ma',
        },
      ],
      { skipHeader: true, origin: 'A2' }
    );
    ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];
    writeFile(wb, 'smartmadrassa_users_template.xlsx');
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const jsonData = await parseUserFile(file);

      // First pass: import all non-parent users and track them
      const { importedUsers, count: countNonParents } = await processNonParentUsers(jsonData, addUser);

      // Second pass: import parents and link to students (including just-imported ones)
      const countParents = await processParentUsers(jsonData, users, importedUsers, addUser);

      const totalImported = countNonParents + countParents;

      toast.success(t('users.importSuccess', { count: totalImported }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error(t('users.importError'));
    }
  };


  const isSuperadmin = currentUser?.role === 'superadmin';
  const visibleUsers = useMemo(() => isSuperadmin ? users : users.filter((u) => u.role !== 'superadmin'), [users, isSuperadmin]);

  const filteredUsers = useMemo(() => visibleUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  }), [visibleUsers, searchQuery, filterRole]);

  const roleCounts = useMemo(() => {
    const counts = {
      all: 0,
      student: 0,
      teacher: 0,
      parent: 0,
      director: 0,
      superadmin: 0,
    };

    // Base count is all visible users
    counts.all = visibleUsers.length;

    visibleUsers.forEach((u) => {
      if (counts[u.role] !== undefined) {
        counts[u.role]++;
      }
    });

    return counts;
  }, [visibleUsers]);

  const getRoleLabel = (r: Role | 'all') => {
    if (r === 'all') return t('users.total');
    return t(`roles.${r}`);
  };

  return {
    isModalOpen,
    setIsModalOpen,
    editingUser,
    searchQuery,
    setSearchQuery,
    filterRole,
    setFilterRole,
    name,
    setName,
    email,
    setEmail,
    role,
    setRole,
    phone,
    setPhone,
    birthDate,
    setBirthDate,
    selectedStudentId,
    setSelectedStudentId,
    students,
    filteredUsers,
    roleCounts,
    roleColors,
    fileInputRef,
    handleOpenNew,
    handleEdit,
    handleSave,
    handleDelete,
    handleDownloadTemplate,
    handleFileUpload,
    getRoleLabel,
  };
}
