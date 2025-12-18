import { type ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from '../LanguageSwitcher';
import ForcePasswordChange from '../Auth/ForcePasswordChange';
import { useAuth } from '../../context/AuthContext';
import { Menu, X } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const isRTL = i18n.language === 'ar';

  // Check if user must change password
  useEffect(() => {
    if (user?.mustChangePassword) {
      setShowPasswordModal(true);
    }
  }, [user?.mustChangePassword]);

  // Track mobile state and auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
      } else {
        // Restore sidebar state on desktop if needed, or keep user preference
        // For now, simpler to leave it as is or auto-expand
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Don't wrap login page in the layout
  if (!user || location.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile by default, shown as overlay when menu open */}
      <div
        className={`
                ${
                  isMobile
                    ? isMobileMenuOpen
                      ? `fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50 w-64 transform transition-transform duration-300 ease-out translate-x-0`
                      : 'hidden'
                    : ''
                }
            `}
      >
        <Sidebar isCollapsed={isMobile ? false : isSidebarCollapsed} />
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isMobile
            ? ''
            : isSidebarCollapsed
              ? isRTL
                ? 'mr-20'
                : 'ml-20'
              : isRTL
                ? 'mr-64'
                : 'ml-64'
        }`}
      >
        {/* Header */}
        <header
          className={`bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm transition-colors duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Sidebar Toggle Button */}
            <button
              onClick={() =>
                isMobile
                  ? setIsMobileMenuOpen(!isMobileMenuOpen)
                  : setIsSidebarCollapsed(!isSidebarCollapsed)
              }
              className="group relative p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 hover:from-orange-100 hover:to-orange-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-orange-200 dark:border-orange-700/50"
              title={isSidebarCollapsed ? t('common.showMenu') : t('common.hideMenu')}
            >
              {(isMobile ? !isMobileMenuOpen : isSidebarCollapsed) ? (
                <Menu size={20} className="text-orange-600" />
              ) : (
                <X size={20} className="text-orange-600" />
              )}
            </button>
          </div>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Profile */}
            <div
              className={`flex items-center gap-3 ${isRTL ? 'pr-4 border-r' : 'pl-4 border-l'} border-gray-200 dark:border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white dark:border-gray-200 shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className={`hidden md:block ${isRTL ? 'text-right' : ''}`}>
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Force Password Change Modal */}
      <ForcePasswordChange
        isOpen={showPasswordModal}
        onSuccess={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

export default MainLayout;
