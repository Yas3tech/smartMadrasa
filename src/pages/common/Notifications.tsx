import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button, Badge } from '../../components/UI';
import {
    Bell,
    Check,
    Trash2,
    Search,
    MessageSquare,
    GraduationCap,
    Calendar,
    AlertCircle,
    Users
} from 'lucide-react';

interface Notification {
    id: string;
    type: 'message' | 'grade' | 'attendance' | 'event' | 'announcement' | 'system';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
    priority: 'low' | 'normal' | 'high';
}

const Notifications = () => {
    const { user } = useAuth();
    const { messages, grades, attendance, events } = useData();

    const [filter, setFilter] = useState<'all' | Notification['type']>('all');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Generate notifications from app data
    const generateNotifications = (): Notification[] => {
        const notifications: Notification[] = [];

        // Message notifications
        const unreadMessages = messages.filter(m => m.receiverId === user?.id && !m.read);
        unreadMessages.forEach(msg => {
            notifications.push({
                id: `msg-${msg.id}`,
                type: 'message',
                title: 'Nouveau message',
                message: `${msg.senderName}: ${msg.subject}`,
                timestamp: msg.timestamp,
                read: false,
                actionUrl: '/messages',
                priority: 'normal'
            });
        });

        // Grade notifications (recent grades)
        if (user?.role === 'student' || user?.role === 'parent') {
            const recentGrades = grades
                .filter(g => user.role === 'student' ? g.studentId === user.id : true)
                .slice(0, 3);
            recentGrades.forEach(grade => {
                notifications.push({
                    id: `grade-${grade.id}`,
                    type: 'grade',
                    title: 'Nouvelle note',
                    message: `${grade.subject}: ${grade.score}/${grade.maxScore}`,
                    timestamp: grade.date,
                    read: false,
                    actionUrl: '/grades',
                    priority: 'normal'
                });
            });
        }

        // Event notifications (upcoming events)
        const upcomingEvents = events
            .filter(e => new Date(e.start) > new Date())
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
            .slice(0, 5);
        upcomingEvents.forEach(event => {
            notifications.push({
                id: `event-${event.id}`,
                type: 'event',
                title: 'Événement à venir',
                message: `${event.title} - ${new Date(event.start).toLocaleDateString('fr-FR')}`,
                timestamp: event.start,
                read: false,
                actionUrl: '/calendar',
                priority: event.type === 'exam' ? 'high' : 'normal'
            });
        });

        // Attendance notifications (for teachers/directors)
        if (user?.role === 'teacher' || user?.role === 'director') {
            const todayDate = new Date().toISOString().split('T')[0];
            const todayAttendance = attendance.filter(a => a.date === todayDate);
            const absentCount = todayAttendance.filter(a => a.status === 'absent').length;

            if (absentCount > 0) {
                notifications.push({
                    id: 'attendance-today',
                    type: 'attendance',
                    title: 'Présence du jour',
                    message: `${absentCount} élève(s) absent(s) aujourd'hui`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    actionUrl: '/attendance',
                    priority: 'normal'
                });
            }
        }

        // System notifications
        notifications.push({
            id: 'system-welcome',
            type: 'system',
            title: 'Bienvenue sur SmartSchool',
            message: 'Découvrez toutes les fonctionnalités de votre plateforme',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            read: true,
            priority: 'low'
        });

        // Sort by timestamp (newest first)
        return notifications.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    };

    const [notifications, setNotifications] = useState<Notification[]>(generateNotifications());

    // Filter and search notifications
    const filteredNotifications = useMemo(() => {
        return notifications.filter(notif => {
            const matchesFilter = filter === 'all' || notif.type === filter;
            const matchesRead = !showUnreadOnly || !notif.read;
            const matchesSearch = searchQuery === '' ||
                notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notif.message.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesFilter && matchesRead && matchesSearch;
        });
    }, [notifications, filter, showUnreadOnly, searchQuery]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'message':
                return <MessageSquare className="text-blue-600" size={20} />;
            case 'grade':
                return <GraduationCap className="text-orange-600" size={20} />;
            case 'attendance':
                return <Users className="text-green-600" size={20} />;
            case 'event':
                return <Calendar className="text-purple-600" size={20} />;
            case 'announcement':
                return <Bell className="text-red-600" size={20} />;
            case 'system':
                return <AlertCircle className="text-gray-600" size={20} />;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-600">
                        {unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Toutes vos notifications sont lues'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="primary" icon={Check} onClick={markAllAsRead}>
                        Tout marquer comme lu
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Bell className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertCircle className="text-orange-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Non lues</p>
                            <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Check className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Lues</p>
                            <p className="text-2xl font-bold text-gray-900">{notifications.length - unreadCount}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Calendar className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Aujourd'hui</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {notifications.filter(n => {
                                    const today = new Date().toDateString();
                                    return new Date(n.timestamp).toDateString() === today;
                                }).length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher une notification..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>

                    {/* Filter by type */}
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant={filter === 'all' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            Toutes
                        </Button>
                        <Button
                            variant={filter === 'message' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter('message')}
                        >
                            Messages
                        </Button>
                        <Button
                            variant={filter === 'grade' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter('grade')}
                        >
                            Notes
                        </Button>
                        <Button
                            variant={filter === 'event' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter('event')}
                        >
                            Événements
                        </Button>
                    </div>

                    {/* Show unread only toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showUnreadOnly}
                            onChange={(e) => setShowUnreadOnly(e.target.checked)}
                            className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-200"
                        />
                        <span className="text-sm text-gray-700 whitespace-nowrap">Non lues</span>
                    </label>
                </div>
            </Card>

            {/* Notifications List */}
            <Card>
                {filteredNotifications.length > 0 ? (
                    <div className="divide-y">
                        {filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`p-4 flex items-start gap-4 transition-colors ${!notification.read ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50'
                                    }`}
                            >
                                {/* Icon */}
                                <div className={`p-3 rounded-xl flex-shrink-0 ${!notification.read ? 'bg-white shadow-sm' : 'bg-gray-50'
                                    }`}>
                                    {getIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'
                                            }`}>
                                            {notification.title}
                                            {!notification.read && (
                                                <span className="ml-2 inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                                            )}
                                        </h3>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                            {formatTimestamp(notification.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={notification.priority === 'high' ? 'error' :
                                                notification.priority === 'normal' ? 'info' : 'success'}
                                            className="text-xs"
                                        >
                                            {notification.type}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1 flex-shrink-0">
                                    {!notification.read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Marquer comme lu"
                                        >
                                            <Check size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune notification</h3>
                        <p className="text-gray-500">
                            {showUnreadOnly
                                ? 'Vous n\'avez pas de notifications non lues'
                                : searchQuery
                                    ? 'Aucune notification ne correspond à votre recherche'
                                    : 'Vous êtes à jour avec toutes vos notifications'
                            }
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Notifications;
