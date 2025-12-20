import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Modal, Button } from '../UI';
import { Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface ForcePasswordChangeProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const ForcePasswordChange = ({ isOpen, onSuccess }: ForcePasswordChangeProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { updateUser } = useData();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (!auth?.currentUser) {
      setError(t('auth.notLoggedIn'));
      return;
    }

    setLoading(true);
    try {
      // Update password in Firebase Auth
      await updatePassword(auth.currentUser, newPassword);

      // Update mustChangePassword flag in Firestore
      if (user?.id) {
        await updateUser(user.id, { mustChangePassword: false });
      }

      toast.success(t('auth.passwordChanged'));
      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError(t('auth.requiresRecentLogin'));
      } else {
        setError(t('auth.passwordChangeError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { }}>
      <div className="p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t('auth.changePasswordRequired')}</h2>
          <p className="text-gray-600 mt-2">{t('auth.changePasswordDescription')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.newPassword')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.confirmPassword')}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <p className="text-xs text-gray-500">{t('auth.passwordRequirements')}</p>

          <Button variant="primary" type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading') : t('auth.changePassword')}
          </Button>
        </form>
      </div>
    </Modal>
  );
};

export default ForcePasswordChange;
