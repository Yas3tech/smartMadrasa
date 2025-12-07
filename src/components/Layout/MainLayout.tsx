import { type ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from '../LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { Menu, X } from 'lucide-react';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
    const { user } = useAuth();
    const location = useLocation();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    // Auto-collapse on mobile by default
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarCollapsed(true);
            }
        };

        handleResize(); // Check on mount
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Don't wrap login page in the layout
    if (!user || location.pathname === '/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
            />

            {/* Main Content Area */}
            <div
                className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'
                    }`}
            >
                {/* Header */}
                <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-4">
                        {/* Sidebar Toggle Button - More Prominent */}
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="group relative p-3 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-orange-200"
                            title={isSidebarCollapsed ? "Afficher le menu" : "Masquer le menu"}
                        >
                            {isSidebarCollapsed ? (
                                <Menu size={20} className="text-orange-600" />
                            ) : (
                                <X size={20} className="text-orange-600" />
                            )}
                            {/* Tooltip */}
                            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {isSidebarCollapsed ? "Afficher le menu" : "Masquer le menu"}
                            </span>
                        </button>
                        <Link to="/" className="text-xl font-bold text-gray-900 hidden md:block hover:text-orange-600 transition-colors">
                            SmartSchool
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Language Switcher */}
                        <LanguageSwitcher />

                        {/* Notification Bell */}
                        <NotificationBell />

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-9 h-9 rounded-full bg-gray-100 border-2 border-white shadow-sm"
                            />
                            <div className="hidden md:block">
                                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
