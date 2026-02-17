import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button, Input } from '../../components/UI';
import { User as UserIcon, Mail, Save, Edit2 } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import type { Student, Parent } from '../../types';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { users, students, classes, courses, updateUser } = useData();
  const isRTL = i18n.language === 'ar';

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');


  const teacherData = useMemo(() => {
    if (!user || user.role !== 'teacher') return { subjects: [], teacherClasses: [] };

    const teacherCourses = courses.filter((c) => c.teacherId === user.id);
    const subjects = [...new Set(teacherCourses.map((c) => c.subject))];
    const classIds = [...new Set(teacherCourses.map((c) => c.classId))];
    const teacherClasses = classes.filter((c) => classIds.includes(c.id));

    return { subjects, teacherClasses };
  }, [user, courses, classes]);

  if (!user) return null;

  const handleSaveProfile = async () => {
    if (user) {
      setIsSaving(true);
      try {
        await updateUser(user.id, { name, email });
        setIsEditing(false);
        toast.success(t('profile.profileUpdated'));
      } catch {
        toast.error(t('auth.errors.generic'));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setName(user.name);
    setEmail(user.email);
    setIsEditing(false);
  };

  const handleSendPasswordReset = async () => {
    if (!auth) {
      toast.error(t('profile.resetEmailError'));
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(t('profile.resetEmailSent'));
    } catch {
      toast.error(t('profile.resetEmailError'));
    }
  };

  const getRoleLabel = (role: string) => {
    return t(`roles.${role}`);
  };


  const getStudentInfo = () => {
    if (user.role !== 'student') return null;
    const studentData = students.find((s) => s.id === user.id) as Student;
    if (!studentData) return null;

    const parent = users.find((u) => u.id === studentData.parentId);
    const classInfo = classes.find((c) => c.id === studentData.classId);

    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('profile.academicInfo')}</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">{t('profile.class')}</span>
            <span className="font-semibold text-gray-900">
              {classInfo?.name || t('profile.notAssigned')}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">{t('profile.parentGuardian')}</span>
            <span className="font-semibold text-gray-900">
              {parent?.name || t('profile.notAssigned')}
            </span>
          </div>
          {parent && (
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{t('profile.parentContact')}</span>
              <span className="font-semibold text-gray-900">{parent.email}</span>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const getParentInfo = () => {
    if (user.role !== 'parent') return null;
    const parentData = user as Parent;
    const children = students.filter((s) => parentData.childrenIds?.includes(s.id));

    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('profile.myChildren')}</h3>
        <div className="space-y-3">
          {children.length > 0 ? (
            children.map((child) => {
              const classInfo = classes.find((c) => c.id === (child as Student).classId);
              return (
                <div key={child.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                    {child.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{child.name}</p>
                    <p className="text-sm text-gray-500">{child.email}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {classInfo?.name || (child as Student).classId}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-4">{t('profile.noChildrenAssigned')}</p>
          )}
        </div>
      </Card>
    );
  };

  const getTeacherInfo = () => {
    if (user.role !== 'teacher') return null;

    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('profile.professionalInfo')}</h3>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600 block mb-2">{t('profile.subjectsTaught')}</span>
            <div className="flex flex-wrap gap-2">
              {teacherData.subjects.length > 0 ? (
                teacherData.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold"
                  >
                    {subject}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">{t('profile.noSubjectsAssigned')}</span>
              )}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600 block mb-2">{t('profile.assignedClasses')}</span>
            <div className="flex flex-wrap gap-2">
              {teacherData.teacherClasses.length > 0 ? (
                teacherData.teacherClasses.map((classGroup) => (
                  <span
                    key={classGroup.id}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold"
                  >
                    {classGroup.name}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">{t('profile.noClassesAssigned')}</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
        {!isEditing && (
          <Button variant="primary" icon={Edit2} onClick={() => setIsEditing(true)}>
            {t('profile.editProfile')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg border-4 border-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500 capitalize">{getRoleLabel(user.role)}</p>
              <span className="mt-3 px-4 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                {getRoleLabel(user.role)}
              </span>
            </div>
          </Card>


          {getStudentInfo()}
          {getParentInfo()}
          {getTeacherInfo()}
        </div>


        <div className="lg:col-span-2 space-y-6">

          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{t('profile.personalInfo')}</h3>
            </div>

            <div className="space-y-4">
              <Input
                label={t('profile.fullName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                icon={UserIcon}
              />

              <Input
                label={t('profile.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
                icon={Mail}
              />

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">{t('profile.role')}</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {getRoleLabel(user.role)}
                </span>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="secondary" onClick={handleCancelEdit} disabled={isSaving}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    icon={Save}
                    onClick={handleSaveProfile}
                    isLoading={isSaving}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              )}
            </div>
          </Card>


          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('profile.changePassword')}</h3>
            <p className="text-sm text-gray-600 mb-6">{t('profile.resetPasswordDesc')}</p>

            <Button variant="primary" icon={Mail} onClick={handleSendPasswordReset}>
              {t('profile.sendResetEmail')}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
