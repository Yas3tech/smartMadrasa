import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Bell, MessageSquare, GraduationCap, Calendar, Users, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'message' | 'grade' | 'attendance' | 'event' | 'announcement' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  originalId?: string | number; // To track the original item ID
}

const NotificationBell = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { messages, grades, events, markMessageAsRead } = useData();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('readNotificationIds');
    return saved ? JSON.parse(saved) : [];
  });

  // Save read IDs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('readNotificationIds', JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  // Generate notifications from app data
  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];

    // Message notifications (only unread ones)
    const unreadMessages = messages.filter((m) => m.receiverId === user?.id && !m.read);
    unreadMessages.slice(0, 3).forEach((msg) => {
      notifications.push({
        id: `msg-${msg.id}`,
        originalId: msg.id,
        type: 'message',
        title: t('notificationCenter.newMessage'),
        message: `${msg.senderName}: ${msg.subject}`,
        timestamp: msg.timestamp,
        read: false,
        actionUrl: '/messages',
      });
    });

    // Grade notifications (recent grades for students)
    if (user?.role === 'student') {
      const recentGrades = grades
        .filter((g) => g.studentId === user.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5); // Check more to filter out read ones

      recentGrades.forEach((grade) => {
        const notifId = `grade-${grade.id}`;
        if (!readNotificationIds.includes(notifId)) {
          notifications.push({
            id: notifId,
            originalId: grade.id,
            type: 'grade',
            title: t('notificationCenter.newGrade'),
            message: `${grade.subject}: ${grade.score}/${grade.maxScore}`,
            timestamp: grade.date,
            read: false,
            actionUrl: '/grades',
          });
        }
      });
    }

    // Event notifications (upcoming events)
    const upcomingEvents = events
      .filter((e) => new Date(e.start) > new Date())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);

    upcomingEvents.forEach((event) => {
      const notifId = `event-${event.id}`;
      if (!readNotificationIds.includes(notifId)) {
        notifications.push({
          id: notifId,
          originalId: event.id,
          type: 'event',
          title: t('notificationCenter.upcomingEvent'),
          message: `${event.title} - ${new Date(event.start).toLocaleDateString('fr-FR')}`,
          timestamp: event.start,
          read: false,
          actionUrl: '/calendar',
        });
      }
    });

    return notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  };

  const notifications = generateNotifications();
  const unreadCount = notifications.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read logic
    if (notification.type === 'message' && notification.originalId) {
      await markMessageAsRead(notification.originalId);
    } else {
      setReadNotificationIds((prev) => [...prev, notification.id]);
    }

    // Navigate
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Mark all visible messages as read
    const messageNotifs = notifications.filter((n) => n.type === 'message' && n.originalId);
    for (const notif of messageNotifs) {
      if (notif.originalId) await markMessageAsRead(notif.originalId);
    }

    // Mark other notifications as read locally
    const otherNotifIds = notifications.filter((n) => n.type !== 'message').map((n) => n.id);

    setReadNotificationIds((prev) => [...prev, ...otherNotifIds]);
    setIsOpen(false);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={18} className="text-blue-600" />;
      case 'grade':
        return <GraduationCap size={18} className="text-orange-600" />;
      case 'event':
        return <Calendar size={18} className="text-purple-600" />;
      case 'attendance':
        return <Users size={18} className="text-green-600" />;
      default:
        return <Bell size={18} className="text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notificationCenter.justNow');
    if (diffMins < 60) return t('notificationCenter.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('notificationCenter.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('notificationCenter.daysAgo', { count: diffDays });
    return date.toLocaleDateString(
      i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'nl' ? 'nl-NL' : 'fr-FR'
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-xl transition-all duration-200 group"
      >
        <Bell size={24} className="group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 max-h-[500px] overflow-hidden flex flex-col"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {t('notificationCenter.title')}
              </h3>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                {unreadCount > 0
                  ? t('notificationCenter.unreadCount', { count: unreadCount })
                  : t('notificationCenter.allRead')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700 underline"
                >
                  {t('notificationCenter.markAllRead')}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors bg-orange-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0 bg-white dark:bg-slate-700 shadow-sm">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                          <span className="ml-1 inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Bell size={40} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {t('notificationCenter.noNotifications')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
