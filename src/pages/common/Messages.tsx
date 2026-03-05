/**
 * Messages Page - Refactored with useMessages hook
 *
 * Uses the useMessages hook for all business logic.
 * Contains UI for folder navigation, message list, and compose modal.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCommunication, useUsers, useAcademics } from '../../context/DataContext';
import { useThrottle } from '../../hooks/useThrottle';
import type { Message, Parent, Student, User } from '../../types';
import { Card, Button } from '../../components/UI';

import { PenSquare, Inbox, Send, Archive } from 'lucide-react';
import ComposeModal from '../../components/Messages/ComposeModal';
import MessageList from '../../components/Messages/MessageList';
import MessageDetail from '../../components/Messages/MessageDetail';

const Messages = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messages, sendMessage, deleteMessage, markMessageAsRead, updateMessage } =
    useCommunication();
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
  const [recipient, setRecipient] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const filteredRecipients = useMemo(() => {
    const studentMap = new Map<string, User>();
    users.forEach((u) => {
      if (u.role === 'student') studentMap.set(u.id, u);
    });

    const allRecipients = [
      {
        type: 'all',
        id: 'all',
        label: `👥 ${t('messages.allUsers')}`,
        searchText: t('messages.allUsers').toLowerCase(),
      },
      ...users.map((u) => {
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
          searchText = `${t('messages.parentOf')} ${childrenNames} ${u.name}`.toLowerCase();
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
    return allRecipients.filter((item) => {
      if (recipientSearch === '') return true;
      return item.searchText.includes(recipientSearch.toLowerCase());
    });
  }, [users, classes, recipientSearch, t]);

  const selectedRecipientLabel = useMemo(() => {
    return recipient
      ? filteredRecipients.find((r) => r.id === recipient)?.label || recipientSearch
      : '';
  }, [recipient, filteredRecipients, recipientSearch]);

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
    setRecipient('');
    setRecipientSearch('');
    setSubject('');
    setContent('');
    setAttachments([]);
    setIsComposeOpen(true);
  };

  const handleReply = (msg: Message) => {
    setComposeMode('reply');
    setRecipient(msg.senderId.toString());
    setSubject(`Re: ${msg.subject}`);
    setContent(
      `\n\n---\nLe ${new Date(msg.timestamp).toLocaleDateString()} à ${new Date(msg.timestamp).toLocaleTimeString()}, ${msg.senderName} a écrit:\n> ${msg.content.split('\n').join('\n> ')}`
    );
    setAttachments([]);
    setIsComposeOpen(true);
  };

  const handleForward = (msg: Message) => {
    setComposeMode('forward');
    setRecipient('');
    setSubject(`Fwd: ${msg.subject}`);
    setContent(`\n\n---\nMessage transféré de ${msg.senderName}:\n\n${msg.content}`);
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
  const handleSendMessage = useThrottle(
    useCallback(() => {
      if (!user || !recipient || !subject || !content) return;
      const selectedRecipient = filteredRecipients.find((r) => r.id === recipient);
      const attachmentUrls = attachments.map((file) => URL.createObjectURL(file));

      if (selectedRecipient?.type === 'class') {
        const selectedClass = classes.find((c) => c.id === recipient);
        if (selectedClass) {
          const classStudents = users.filter(
            (u) => u.role === 'student' && (u as Student).classId === selectedClass.id
          );
          const classTeacher = users.find((u) => u.id === selectedClass.teacherId);
          classStudents.forEach((student) => {
            sendMessage({
              senderId: user.id,
              senderName: user.name,
              senderRole: user.role,
              receiverId: student.id,
              subject: `[${selectedClass.name}] ${subject}`,
              content,
              read: false,
              type: 'group',
              attachments: attachmentUrls,
            });
          });
          if (classTeacher) {
            sendMessage({
              senderId: user.id,
              senderName: user.name,
              senderRole: user.role,
              receiverId: classTeacher.id,
              subject: `[${selectedClass.name}] ${subject}`,
              content,
              read: false,
              type: 'group',
              attachments: attachmentUrls,
            });
          }
        }
      } else {
        sendMessage({
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role,
          receiverId: recipient,
          subject,
          content,
          read: false,
          type: recipient === 'all' ? 'broadcast' : 'individual',
          attachments: attachmentUrls,
        });
      }

      setIsComposeOpen(false);
      setRecipient('');
      setRecipientSearch('');
      setSubject('');
      setContent('');
      setAttachments([]);
    }, [
      user,
      recipient,
      subject,
      content,
      filteredRecipients,
      classes,
      users,
      sendMessage,
      attachments,
    ]),
    2000
  );

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
          className={`${
            isMobile
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedFolder === folder.id
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
        recipient={recipient}
        setRecipient={setRecipient}
        recipientSearch={recipientSearch}
        setRecipientSearch={setRecipientSearch}
        showRecipientDropdown={showRecipientDropdown}
        setShowRecipientDropdown={setShowRecipientDropdown}
        filteredRecipients={filteredRecipients}
        selectedRecipientLabel={selectedRecipientLabel}
        subject={subject}
        setSubject={setSubject}
        content={content}
        setContent={setContent}
        attachments={attachments}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        removeAttachment={removeAttachment}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default Messages;
