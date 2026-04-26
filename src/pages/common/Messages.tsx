/**
 * Messages Page - Refactored with useMessages hook
 *
 * Uses the useMessages hook for all business logic.
 * Contains UI for folder navigation, message list, and compose modal.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCommunication, useUsers, useAcademics } from '../../context/DataContext';
import { useThrottle } from '../../hooks/useThrottle';
import type { Message, Parent, Student, User } from '../../types';
import { Card, Button } from '../../components/UI';
import { generateMessagePath, uploadFile } from '../../services/storage';

import {
  PenSquare,
  Inbox,
  Send,
  Archive,
} from 'lucide-react';
import ComposeModal from '../../components/Messages/ComposeModal';
import MessageList from '../../components/Messages/MessageList';
import MessageDetail from '../../components/Messages/MessageDetail';

const Messages = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messages, sendMessage, deleteMessage, markMessageAsRead, updateMessage } = useCommunication();
  const { users } = useUsers();
  const { classes } = useAcademics();

  // Folder state
  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'sent' | 'archive'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [mobileView, setMobileView] = useState<'folders' | 'list' | 'detail'>('folders');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compose state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<'new' | 'reply' | 'forward'>('new');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MIN_RECIPIENT_SEARCH_CHARS = 2;
  const isDirectorOrSuperAdmin = user?.role === 'director' || user?.role === 'superadmin';

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const matchesSearch =
        msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.senderName.toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedFolder === 'inbox') {
        return msg.receiverId === user?.id && !msg.archived && matchesSearch;
      } else if (selectedFolder === 'sent') {
        return msg.senderId === user?.id && !msg.archived && matchesSearch;
      } else if (selectedFolder === 'archive') {
        return (
          (msg.receiverId === user?.id || msg.senderId === user?.id) &&
          msg.archived &&
          matchesSearch
        );
      }
      return matchesSearch;
    });
  }, [messages, searchQuery, selectedFolder, user?.id]);

  const allRecipientOptions = useMemo(() => {
    const studentMap = new Map<string, User>();
    users.forEach((u) => {
      if (u.role === 'student') studentMap.set(u.id, u);
    });

    const visibleUsers = users.filter((u) => {
      if (u.role === 'superadmin' && !isDirectorOrSuperAdmin) return false;
      return true;
    });

    return [
      ...(isDirectorOrSuperAdmin
        ? [
          {
            type: 'all',
            id: 'all',
            label: `👥 ${t('messages.allUsers')}`,
            searchText: t('messages.allUsers').toLowerCase(),
          },
        ]
        : []),
      ...visibleUsers.map((u) => {
        let label = '';
        let searchText = '';
        if (u.role === 'parent') {
          const parent = u as Parent;
          const children: User[] = [];
          if (parent.childrenIds) {
            parent.childrenIds.forEach((childId) => {
              const child = studentMap.get(childId);
              if (child) children.push(child);
            });
          }
          const childrenNames = children.map((c) => c.name).join(', ');
          label = `👨‍👩‍👧 ${t('messages.parentOf')} ${childrenNames || t('roles.student')}`;
          searchText = `${t('messages.parentOf')} ${childrenNames} ${u.name} ${u.email}`.toLowerCase();
        } else if (u.role === 'student') {
          label = `🎓 ${u.name}`;
          searchText = `${u.name} ${t('roles.student')}`.toLowerCase();
        } else {
          const roleEmoji = u.role === 'teacher' ? '👨‍🏫' : u.role === 'director' ? '👔' : '👤';
          label = `${roleEmoji} ${u.name} (${t(`roles.${u.role}`)})`;
          searchText = `${u.name} ${t(`roles.${u.role}`)}`.toLowerCase();
        }
        return { type: 'user', id: u.id, label, searchText };
      }),
      ...classes.map((c) => ({
        type: 'class',
        id: c.id,
        label: `🏫 ${c.name}`,
        searchText: `${c.name} ${t('common.classes')}`.toLowerCase(),
      })),
    ];
  }, [users, classes, t, isDirectorOrSuperAdmin]);

  const filteredRecipients = useMemo(() => {
    const query = recipientSearch.trim().toLowerCase();
    if (query.length < MIN_RECIPIENT_SEARCH_CHARS) return [];
    // Filter out already selected recipients
    return allRecipientOptions.filter((item) =>
      !recipients.includes(item.id) && item.searchText.includes(query)
    );
  }, [recipientSearch, allRecipientOptions, MIN_RECIPIENT_SEARCH_CHARS, recipients]);

  const recipientOptionsMap = useMemo(() => {
    const map = new Map();
    allRecipientOptions.forEach(opt => map.set(opt.id, opt));
    return map;
  }, [allRecipientOptions]);

  const selectedRecipientLabels = useMemo(() => {
    return recipients.map(id => {
      const opt = recipientOptionsMap.get(id);
      return { id, label: opt?.label || id };
    });
  }, [recipients, recipientOptionsMap]);


  const handleArchiveMessage = async (messageId: string | number) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;
    await updateMessage(messageId, { archived: !message.archived });
    if (
      message.archived === false &&
      selectedMessage?.id === messageId &&
      selectedFolder !== 'archive'
    ) {
      setSelectedMessage(null);
    }
  };

  const handleComposeNew = () => {
    setComposeMode('new');
    setRecipients([]);
    setRecipientSearch('');
    setSubject('');
    setContent('');
    setAttachments([]);
    setIsComposeOpen(true);
  };

  const handleReply = (msg: Message) => {
    setComposeMode('reply');
    setRecipients([msg.senderId.toString()]);
    setSubject(`Re: ${msg.subject}`);
    setContent(
      `\n\n---\nLe ${new Date(msg.timestamp).toLocaleDateString()} a ${new Date(msg.timestamp).toLocaleTimeString()}, ${msg.senderName} a ecrit:\n> ${msg.content.split('\n').join('\n> ')}`
    );
    setAttachments([]);
    setIsComposeOpen(true);
  };

  const handleForward = (msg: Message) => {
    setComposeMode('forward');
    setRecipients([]);
    setSubject(`Fwd: ${msg.subject}`);
    setContent(`\n\n---\nMessage transfere de ${msg.senderName}:\n\n${msg.content}`);
    setAttachments([]);
    setIsComposeOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // SECURITY: Throttle message sending to prevent spam (2 second cooldown)
  const handleSendMessage = useThrottle(useCallback(async () => {
    if (!user || recipients.length === 0 || !subject || !content || isSending) return;

    setIsSending(true);

    try {
      const attachmentUrls = await Promise.all(
        attachments.map((file) => uploadFile(file, generateMessagePath(user.id, file.name)))
      );

      const classesMap = new Map(classes.map(c => [c.id, c]));
      const usersMap = new Map(users.map(u => [u.id, u]));

      const allOutbound = recipients.map(async (recipientId) => {
        const selectedRecipient = recipientOptionsMap.get(recipientId);

        if (selectedRecipient?.type === 'class') {
          const selectedClass = classesMap.get(recipientId);
          if (selectedClass) {
            const classStudents = users.filter(
              (u) => u.role === 'student' && (u as Student).classId === selectedClass.id
            );
            const classTeacher = usersMap.get(selectedClass.teacherId);
            const classOutbound = classStudents.map((student) =>
              sendMessage({
                senderId: user.id,
                senderName: user.name,
                senderEmail: user.email,
                senderRole: user.role,
                receiverId: student.id,
                subject: `[${selectedClass.name}] ${subject}`,
                content,
                read: false,
                type: 'group',
                attachments: attachmentUrls,
              })
            );

            if (classTeacher) {
              classOutbound.push(
                sendMessage({
                  senderId: user.id,
                  senderName: user.name,
                  senderEmail: user.email,
                  senderRole: user.role,
                  receiverId: classTeacher.id,
                  subject: `[${selectedClass.name}] ${subject}`,
                  content,
                  read: false,
                  type: 'group',
                  attachments: attachmentUrls,
                })
              );
            }
            return Promise.all(classOutbound);
          }
        } else {
          return sendMessage({
            senderId: user.id,
            senderName: user.name,
            senderEmail: user.email,
            senderRole: user.role,
            receiverId: recipientId,
            subject,
            content,
            read: false,
            type: recipientId === 'all' ? 'broadcast' : 'individual',
            attachments: attachmentUrls,
          });
        }
      });

      await Promise.all(allOutbound);

      setIsComposeOpen(false);
      setRecipients([]);
      setRecipientSearch('');
      setSubject('');
      setContent('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to upload message attachments or send message', error);
      toast.error(t('common.error'));
    } finally {
      setIsSending(false);
    }
  }, [user, recipients, subject, content, isSending, allRecipientOptions, classes, users, sendMessage, attachments, t]), 2000);

  const handleSelectMessage = (msg: Message) => {
    setSelectedMessage(msg);
    if (!msg.read && selectedFolder === 'inbox') {
      markMessageAsRead(msg.id);
    }
    if (isMobile) setMobileView('detail');
  };

  const handleDeleteMessage = (msgId: string | number) => {
    deleteMessage(msgId);
    if (selectedMessage?.id === msgId) setSelectedMessage(null);
  };

  const folders = [
    { id: 'inbox' as const, label: t('messages.folders.inbox'), icon: Inbox },
    { id: 'sent' as const, label: t('messages.folders.sent'), icon: Send },
    { id: 'archive' as const, label: t('messages.folders.archive'), icon: Archive },
  ];

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <Card className="flex-1 flex overflow-hidden !p-0 border-0 shadow-xl">
        {/* Left Sidebar - Folders */}
        <div
          className={`${isMobile
            ? mobileView === 'folders'
              ? 'flex-1 w-full bg-white dark:bg-slate-800'
              : 'hidden'
            : 'w-64 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 flex flex-col'
            }`}
        >
          <div className="p-4">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Inbox size={18} />
              </div>
              <span className="font-bold text-gray-800 dark:text-white">SmartMadrassa</span>
            </div>
            <Button
              className="w-full justify-start mb-6"
              icon={PenSquare}
              onClick={handleComposeNew}
            >
              {t('messages.newMessage')}
            </Button>
            <nav className="space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    if (isMobile) setMobileView('list');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${selectedFolder === folder.id
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                >
                  <folder.icon size={18} />
                  {folder.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <MessageList
          isMobile={isMobile}
          mobileView={mobileView}
          setMobileView={setMobileView}
          selectedFolder={selectedFolder}
          folders={folders}
          filteredMessages={filteredMessages}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSelectMessage={handleSelectMessage}
          selectedMessage={selectedMessage}
        />

        {/* Right Column - Message Detail */}
        <MessageDetail
          isMobile={isMobile}
          mobileView={mobileView}
          setMobileView={setMobileView}
          selectedMessage={selectedMessage}
          handleReply={handleReply}
          handleForward={handleForward}
          handleArchiveMessage={handleArchiveMessage}
          handleDeleteMessage={handleDeleteMessage}
        />
      </Card>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        composeMode={composeMode}
        recipients={recipients}
        setRecipients={setRecipients}
        recipientSearch={recipientSearch}
        setRecipientSearch={setRecipientSearch}
        showRecipientDropdown={showRecipientDropdown}
        setShowRecipientDropdown={setShowRecipientDropdown}
        filteredRecipients={filteredRecipients}
        recipientSearchMinChars={MIN_RECIPIENT_SEARCH_CHARS}
        selectedRecipientLabels={selectedRecipientLabels}
        subject={subject}
        setSubject={setSubject}
        content={content}
        setContent={setContent}
        attachments={attachments}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        removeAttachment={removeAttachment}
        handleSendMessage={handleSendMessage}
        isSending={isSending}
      />
    </div>
  );
};

export default Messages;
