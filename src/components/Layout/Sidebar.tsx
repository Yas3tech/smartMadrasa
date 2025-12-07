import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    GraduationCap,
    ClipboardCheck,
    LogOut,
    School,
    BookOpen,
    Megaphone,
    ClockIcon,
    Settings as SettingsIcon,
    User,
    BarChart3,
    FileText,
    Calendar as CalendarIcon
} from 'lucide-react';
import type { Role } from '../../types';

interface SidebarProps {
    isCollapsed: boolean;
}

const Sidebar = ({ isCollapsed }: SidebarProps) => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { messages } = useData();

    // Count unread messages
    const unreadCount = messages.filter(m => m.receiverId === user?.id && !m.read).length;

    const getLinks = (role: Role) => {
        const links = [
            { to: '/', icon: LayoutDashboard, label: t('sidebar.dashboard') },
            { to: '/messages', icon: MessageSquare, label: t('sidebar.messages'), badge: unreadCount > 0 ? unreadCount : undefined },
            { to: '/announcements', icon: Megaphone, label: t('sidebar.announcements') },
        ];

        if (role === 'student') {
            links.push(
                { to: '/schedule', icon: ClockIcon, label: t('sidebar.schedule') },
                { to: '/homework', icon: BookOpen, label: t('sidebar.homework') },
                { to: '/grades', icon: GraduationCap, label: t('sidebar.grades') },
                { to: '/bulletins/view', icon: FileText, label: t('sidebar.bulletins') }
            );
        }

        if (role === 'parent') {
            links.push(
                { to: '/grades', icon: GraduationCap, label: t('sidebar.grades') },
                { to: '/attendance', icon: ClipboardCheck, label: t('sidebar.attendance') },
                { to: '/homework', icon: BookOpen, label: t('sidebar.homework') },
                { to: '/bulletins/view', icon: FileText, label: t('sidebar.bulletins') }
            );
        }

        if (role === 'teacher') {
            links.push(
                { to: '/schedule', icon: ClockIcon, label: t('sidebar.schedule') },
                { to: '/homework', icon: BookOpen, label: t('sidebar.homework') },
                { to: '/grades', icon: GraduationCap, label: t('sidebar.grades') },
                { to: '/attendance', icon: ClipboardCheck, label: t('sidebar.attendance') },
                { to: '/bulletins/grades', icon: FileText, label: t('sidebar.bulletinGrades') }
            );
        }

        if (role === 'director' || role === 'superadmin') {
            links.push(
                { to: '/admin/analytics', icon: BarChart3, label: t('sidebar.analytics') },
                { to: '/users', icon: Users, label: t('sidebar.users') },
                { to: '/classes', icon: School, label: t('sidebar.classes') },
                { to: '/grades', icon: GraduationCap, label: t('sidebar.grades') },
                { to: '/attendance', icon: ClipboardCheck, label: t('sidebar.attendance') },
                { to: '/bulletins/config', icon: CalendarIcon, label: t('sidebar.bulletinConfig') },
                { to: '/bulletins/dashboard', icon: FileText, label: t('sidebar.bulletinDashboard') },
                { to: '/admin/settings', icon: SettingsIcon, label: t('sidebar.settings') }
            );
        }

        // Add Profile and Settings for all users at the end
        links.push(
            { to: '/profile', icon: User, label: t('sidebar.profile') },
            { to: '/settings', icon: SettingsIcon, label: t('sidebar.preferences') }
        );

        return links;
    };

    if (!user) return null;

    return (
        <aside
            className={`bg-white border-r border-gray-100 h-screen flex flex-col fixed left-0 top-0 z-50 shadow-soft transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Header */}
            <Link to="/" className="p-6 flex items-center gap-3 hover:bg-gray-50 transition-colors rounded-xl mx-2 mt-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-200">
                    S
                </div>
                {!isCollapsed && (
                    <span className="font-bold text-xl text-gray-800 tracking-tight">SmartMadrassa</span>
                )}
            </Link>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {getLinks(user.role).map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                ? 'bg-orange-50 text-orange-600 font-medium shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                        title={isCollapsed ? link.label : undefined}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full" />
                                )}
                                <link.icon size={22} className={`transition-transform duration-200 flex-shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                {!isCollapsed && (
                                    <>
                                        <span className="flex-1">{link.label}</span>
                                        {'badge' in link && link.badge && (
                                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                                                {link.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                                {isCollapsed && 'badge' in link && link.badge && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {link.badge}
                                    </div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile & Actions */}
            <div className="p-4 border-t border-gray-100">
                <div className={`flex items-center gap-3 mb-6 ${isCollapsed ? 'justify-center' : ''}`}>
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white shadow-sm"
                    />
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize">
                                {t(`roles.${user.role}`)}
                            </p>
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <div className="mb-4">
                        {/* Role Switcher removed as it requires specific auth implementation */}
                    </div>
                )}

                <button
                    onClick={logout}
                    className={`flex items-center gap-2 text-sm text-red-500 hover:text-red-600 w-full px-2 py-2 rounded-lg hover:bg-red-50 transition-colors ${isCollapsed ? 'justify-center' : ''
                        }`}
                    title={t('sidebar.logout')}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span>{t('sidebar.logout')}</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
