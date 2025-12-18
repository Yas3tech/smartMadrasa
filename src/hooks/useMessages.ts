import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { Message, Parent, Student } from '../types';
import { useTranslation } from 'react-i18next';

export interface UseMessagesReturn {
  // Folder state
  selectedFolder: 'inbox' | 'sent' | 'archive';
  setSelectedFolder: (folder: 'inbox' | 'sent' | 'archive') => void;
  filteredMessages: Message[];

  // Selected message
  selectedMessage: Message | null;
  setSelectedMessage: (msg: Message | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Mobile state
  isMobile: boolean;
  mobileView: 'folders' | 'list' | 'detail';
  setMobileView: (view: 'folders' | 'list' | 'detail') => void;

  // Compose state
  isComposeOpen: boolean;
  setIsComposeOpen: (open: boolean) => void;
  composeMode: 'new' | 'reply' | 'forward';
  recipient: string;
  setRecipient: (recipient: string) => void;
  recipientSearch: string;
  setRecipientSearch: (search: string) => void;
  showRecipientDropdown: boolean;
  setShowRecipientDropdown: (show: boolean) => void;
  subject: string;
  setSubject: (subject: string) => void;
  content: string;
  setContent: (content: string) => void;
  attachments: File[];
  setAttachments: (files: File[]) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  filteredRecipients: { type: string; id: string; label: string; searchText: string }[];
  selectedRecipientLabel: string;

  // Handlers
  handleArchiveMessage: (messageId: string | number) => Promise<void>;
  handleComposeNew: () => void;
  handleReply: (msg: Message) => void;
  handleForward: (msg: Message) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (index: number) => void;
  handleSendMessage: () => void;
  handleSelectMessage: (msg: Message) => void;
  handleDeleteMessage: (msgId: string | number) => void;
}

export function useMessages(): UseMessagesReturn {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messages, sendMessage, deleteMessage, markMessageAsRead, updateMessage, users, classes } =
    useData();

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

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
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
        (msg.receiverId === user?.id || msg.senderId === user?.id) && msg.archived && matchesSearch
      );
    }
    return matchesSearch;
  });

  // Filter recipients
  const filteredRecipients = (() => {
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
          const children = users.filter(
            (child) => child.role === 'student' && parent.childrenIds?.includes(child.id)
          );
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
  })();

  const selectedRecipientLabel = recipient
    ? filteredRecipients.find((r) => r.id === recipient)?.label || recipientSearch
    : '';

  // Handlers
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

  const handleSendMessage = () => {
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
  };

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

  return {
    selectedFolder,
    setSelectedFolder,
    filteredMessages,
    selectedMessage,
    setSelectedMessage,
    searchQuery,
    setSearchQuery,
    isMobile,
    mobileView,
    setMobileView,
    isComposeOpen,
    setIsComposeOpen,
    composeMode,
    recipient,
    setRecipient,
    recipientSearch,
    setRecipientSearch,
    showRecipientDropdown,
    setShowRecipientDropdown,
    subject,
    setSubject,
    content,
    setContent,
    attachments,
    setAttachments,
    fileInputRef,
    filteredRecipients,
    selectedRecipientLabel,
    handleArchiveMessage,
    handleComposeNew,
    handleReply,
    handleForward,
    handleFileSelect,
    removeAttachment,
    handleSendMessage,
    handleSelectMessage,
    handleDeleteMessage,
  };
}
