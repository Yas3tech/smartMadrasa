import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Modal, Badge } from '../../components/UI';
import { Megaphone, Pin, Clock, Plus, X, AlertCircle, Info, Trash2 } from 'lucide-react';
import {
  subscribeToAnnouncements,
  createAnnouncement,
  updateAnnouncement as updateAnnouncementService,
  deleteAnnouncement as deleteAnnouncementService,
  type Announcement,
} from '../../services/announcements';
import toast from 'react-hot-toast';

const Announcements = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | Announcement['type']>('all');
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<Announcement['type']>('general');
  const [target, setTarget] = useState<Announcement['target']>('all');


  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements((data) => {
      setAnnouncements(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateAnnouncement = async () => {
    if (!title || !content) return;

    try {
      await createAnnouncement({
        title,
        content,
        type,
        target,
        author: 'Direction',
        authorRole: user?.role || '',
        date: new Date().toISOString(),
        pinned: false,
        read: false,
      });
      toast.success(t('announcements.created'));
      setIsModalOpen(false);
      resetForm();
    } catch {
      toast.error(t('announcements.createError'));
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('general');
    setTarget('all');
  };

  const togglePin = async (id: string, currentPinned: boolean) => {
    try {
      await updateAnnouncementService(id, { pinned: !currentPinned });
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm(t('announcements.actions.confirmDelete'))) {
      try {
        await deleteAnnouncementService(id);
        toast.success(t('announcements.deleted'));
      } catch {
        toast.error(t('common.error'));
      }
    }
  };

  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle className="text-red-600" size={20} />;
      case 'event':
        return <Clock className="text-purple-600" size={20} />;
      case 'info':
        return <Info className="text-blue-600" size={20} />;
      default:
        return <Megaphone className="text-gray-600" size={20} />;
    }
  };

  const getTypeColor = (type: Announcement['type']) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'event':
        return 'bg-purple-50 border-purple-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };


  const getRoleTarget = (role: string | undefined): string => {
    switch (role) {
      case 'student':
        return 'students';
      case 'parent':
        return 'parents';
      case 'teacher':
        return 'teachers';
      default:
        return 'all';
    }
  };

  const userTarget = getRoleTarget(user?.role);
  const canSeeAnnouncement = (a: Announcement) => {
    if (user?.role === 'director' || user?.role === 'superadmin') return true;
    return a.target === 'all' || a.target === userTarget;
  };

  const filteredAnnouncements = announcements
    .filter((a) => canSeeAnnouncement(a))
    .filter((a) => filter === 'all' || a.type === filter)
    .sort((a, b) => {
      // Pinned first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const canCreate = user?.role === 'director' || user?.role === 'superadmin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('announcements.title')}</h1>
          <p className="text-gray-600">{t('announcements.subtitle')}</p>
        </div>
        {canCreate && (
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            {t('announcements.newAnnouncement')}
          </Button>
        )}
      </div>

      {/* Stats and Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card
          className={`p-4 cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:shadow-md'}`}
          onClick={() => setFilter('all')}
        >
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">{t('announcements.all')}</p>
            <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
          </div>
        </Card>
        <Card
          className={`p-4 cursor-pointer transition-all ${filter === 'urgent' ? 'ring-2 ring-red-500 bg-red-50' : 'hover:shadow-md'}`}
          onClick={() => setFilter('urgent')}
        >
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">{t('announcements.urgent')}</p>
            <p className="text-2xl font-bold text-red-600">
              {announcements.filter((a) => a.type === 'urgent').length}
            </p>
          </div>
        </Card>
        <Card
          className={`p-4 cursor-pointer transition-all ${filter === 'event' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'}`}
          onClick={() => setFilter('event')}
        >
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">{t('announcements.events')}</p>
            <p className="text-2xl font-bold text-purple-600">
              {announcements.filter((a) => a.type === 'event').length}
            </p>
          </div>
        </Card>
        <Card
          className={`p-4 cursor-pointer transition-all ${filter === 'info' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
          onClick={() => setFilter('info')}
        >
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">{t('announcements.info')}</p>
            <p className="text-2xl font-bold text-blue-600">
              {announcements.filter((a) => a.type === 'info').length}
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">{t('announcements.pinned')}</p>
            <p className="text-2xl font-bold text-orange-600">
              {announcements.filter((a) => a.pinned).length}
            </p>
          </div>
        </Card>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <Card
            key={announcement.id}
            className={`p-6 border-2 ${getTypeColor(announcement.type)} ${!announcement.read ? 'shadow-lg' : ''
              }`}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`p-3 rounded-xl bg-white shadow-sm flex-shrink-0`}>
                {getTypeIcon(announcement.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900">{announcement.title}</h3>
                    {announcement.pinned && <Pin className="text-orange-500" size={18} />}
                    {!announcement.read && (
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    )}
                  </div>
                  {canCreate && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => togglePin(announcement.id, announcement.pinned)}
                        className={`p-2 rounded-lg transition-colors ${announcement.pinned
                          ? 'text-orange-600 bg-orange-100'
                          : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                          }`}
                        title={
                          announcement.pinned
                            ? t('announcements.actions.unpin')
                            : t('announcements.actions.pin')
                        }
                      >
                        <Pin size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('announcements.actions.delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 mb-3">{announcement.content}</p>

                <div className="flex items-center gap-4 flex-wrap">
                  <Badge
                    variant={
                      announcement.type === 'urgent'
                        ? 'error'
                        : announcement.type === 'event'
                          ? 'info'
                          : 'success'
                    }
                  >
                    {t(`announcements.types.${announcement.type}`)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {t('announcements.publishedBy')} Direction
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(announcement.date).toLocaleDateString(i18n.language, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-sm text-gray-500 capitalize">
                    {t('announcements.for')}: {t(`announcements.targets.${announcement.target}`)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredAnnouncements.length === 0 && (
          <Card className="p-12 text-center">
            <Megaphone size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('announcements.noAnnouncements')}
            </h3>
            <p className="text-gray-500">{t('announcements.noAnnouncementsCategory')}</p>
          </Card>
        )}
      </div>

      {/* Create Announcement Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {t('announcements.newAnnouncement')}
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
                {t('announcements.form.title')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                placeholder={t('announcements.form.placeholders.title')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('announcements.form.content')}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                placeholder={t('announcements.form.placeholders.content')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('announcements.form.type')}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Announcement['type'])}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                >
                  <option value="general">{t('announcements.types.general')}</option>
                  <option value="urgent">{t('announcements.types.urgent')}</option>
                  <option value="event">{t('announcements.types.event')}</option>
                  <option value="info">{t('announcements.types.info')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('announcements.form.target')}
                </label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value as Announcement['target'])}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                >
                  <option value="all">{t('announcements.targets.all')}</option>
                  <option value="students">{t('announcements.targets.students')}</option>
                  <option value="parents">{t('announcements.targets.parents')}</option>
                  <option value="teachers">{t('announcements.targets.teachers')}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handleCreateAnnouncement}>
                {t('announcements.form.publish')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Announcements;
