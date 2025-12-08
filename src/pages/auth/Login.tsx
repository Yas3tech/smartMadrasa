import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components/UI';
import { LogIn, AlertCircle, School } from 'lucide-react';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { user } = useAuth(); // Get user from context

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) {
            setError('Firebase is not initialized');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Navigation is handled by the useEffect above
        } catch (err) {
            const authError = err as AuthError;
            console.error('Login error:', authError);
            if (authError.code === 'auth/invalid-credential') {
                setError(t('auth.errors.invalidCredentials'));
            } else if (authError.code === 'auth/too-many-requests') {
                setError(t('auth.errors.tooManyRequests'));
            } else {
                setError(t('auth.errors.generic'));
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg transform rotate-3">
                        <School size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">SmartMadrassa</h1>
                    <p className="text-gray-500 mt-2">{t('auth.signInToContinue')}</p>
                </div>

                <Card className="p-8 shadow-xl border-0">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Input
                                label={t('auth.email')}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="exemple@ecole.com"
                                required
                            />
                            <Input
                                label={t('auth.password')}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-200"
                            disabled={loading}
                            icon={LogIn}
                        >
                            {loading ? t('auth.loading') : t('auth.login')}
                        </Button>

                        <div className="text-center">
                            <a href="#" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                                {t('auth.forgotPassword')}
                            </a>
                        </div>
                    </form>
                </Card>

                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>{t('common.copyright')}</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
