/**
 * User Management Page - Refactored with useUsers hook
 *
 * Uses the useUsers hook for all business logic.
 * Contains UI for user listing, filtering, and CRUD operations.
 */

import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Modal, Input } from '../../components/UI';
import { Plus, Edit2, Trash2, Search, X, FileSpreadsheet, FileDown } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import type { Role } from '../../types';

const UserManagement = () => {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const {
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
  } = useUsers();
  const isRTL = i18n.language === 'ar';

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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <Button variant="secondary" icon={FileDown} onClick={handleDownloadTemplate}>
            {t('users.downloadTemplate')}
          </Button>
          <Button
            variant="secondary"
            icon={FileSpreadsheet}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('users.importExcel')}
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
    </div>
  );
};

export default UserManagement;
