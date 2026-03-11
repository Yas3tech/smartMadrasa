import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/DataContext';
import { Modal, Button } from '../UI';
import { Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface ForcePasswordChangeProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const ForcePasswordChange = ({ isOpen, onSuccess }: ForcePasswordChangeProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { updateUser } = useUsers();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const copy = i18n.language.startsWith('nl')
    ? {
        title: 'Wachtwoord wijzigen vereist',
        description: 'Om uw account te beveiligen moet u uw standaardwachtwoord wijzigen.',
        newPassword: 'Nieuw wachtwoord',
        confirmPassword: 'Bevestig wachtwoord',
        tooShort: 'Het wachtwoord moet minstens 8 tekens bevatten',
        complexity:
          'Het wachtwoord moet een hoofdletter, kleine letter, cijfer en speciaal teken bevatten',
        mismatch: 'Wachtwoorden komen niet overeen',
        changed: 'Wachtwoord succesvol gewijzigd',
        changeError: 'Fout bij het wijzigen van het wachtwoord',
        recentLogin: 'Log opnieuw in en probeer opnieuw',
        notLoggedIn: 'U bent niet aangemeld',
        requirements: 'Het wachtwoord moet minstens 8 tekens bevatten',
        action: 'Wachtwoord wijzigen',
      }
    : i18n.language.startsWith('ar')
      ? {
          title: 'مطلوب تغيير كلمة المرور',
          description: 'لتأمين حسابك يجب عليك تغيير كلمة المرور الافتراضية.',
          newPassword: 'كلمة المرور الجديدة',
          confirmPassword: 'تأكيد كلمة المرور',
          tooShort: 'يجب ان تحتوي كلمة المرور على 8 احرف على الاقل',
          complexity: 'يجب ان تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم ورمز خاص',
          mismatch: 'كلمتا المرور غير متطابقتين',
          changed: 'تم تغيير كلمة المرور بنجاح',
          changeError: 'خطأ اثناء تغيير كلمة المرور',
          recentLogin: 'يرجى تسجيل الدخول مجددا ثم المحاولة مرة اخرى',
          notLoggedIn: 'لست مسجل الدخول',
          requirements: 'يجب ان تحتوي كلمة المرور على 8 احرف على الاقل',
          action: 'تغيير كلمة المرور',
        }
      : {
          title: 'Changement de mot de passe requis',
          description:
            'Pour securiser votre compte, vous devez changer votre mot de passe par defaut.',
          newPassword: 'Nouveau mot de passe',
          confirmPassword: 'Confirmer le mot de passe',
          tooShort: 'Le mot de passe doit contenir au moins 8 caracteres',
          complexity:
            'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractere special',
          mismatch: 'Les mots de passe ne correspondent pas',
          changed: 'Mot de passe change avec succes',
          changeError: 'Erreur lors du changement de mot de passe',
          recentLogin: 'Veuillez vous reconnecter et reessayer',
          notLoggedIn: "Vous n'etes pas connecte",
          requirements: 'Le mot de passe doit contenir au moins 8 caracteres',
          action: 'Changer le mot de passe',
        };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError(copy.tooShort);
      return;
    }

    const complexityRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!complexityRegex.test(newPassword)) {
      setError(copy.complexity);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(copy.mismatch);
      return;
    }

    if (!auth?.currentUser) {
      setError(copy.notLoggedIn);
      return;
    }

    setLoading(true);
    try {
      await updatePassword(auth.currentUser, newPassword);

      if (user?.id) {
        await updateUser(user.id, { mustChangePassword: false });
      }

      toast.success(copy.changed);
      onSuccess();
    } catch (err) {
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code === 'auth/requires-recent-login') {
        setError(copy.recentLogin);
      } else {
        setError(copy.changeError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <div className="p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{copy.title}</h2>
          <p className="text-gray-600 mt-2">{copy.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {copy.newPassword}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                placeholder="********"
                autoComplete="new-password"
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
              {copy.confirmPassword}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              placeholder="********"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <p className="text-xs text-gray-500">{copy.requirements}</p>

          <Button variant="primary" type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading') : copy.action}
          </Button>
        </form>
      </div>
    </Modal>
  );
};

export default ForcePasswordChange;
