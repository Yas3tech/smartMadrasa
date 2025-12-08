import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button, Modal, Input } from '../../components/UI';
import {
    Search,
    PenSquare,
    Inbox,
    Send,
    Archive,
    Trash2,
    Reply as ReplyIcon,
    Forward as ForwardIcon,
    Filter,
    X,
    Paperclip,
    File
} from 'lucide-react';
import type { Message } from '../../types';

const Messages = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { messages, sendMessage, deleteMessage, markMessageAsRead, updateMessage, users, classes } = useData();

    const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'sent' | 'archive'>('inbox');
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeMode, setComposeMode] = useState<'new' | 'reply' | 'forward'>('new');

    // Compose form state
    const [recipient, setRecipient] = useState('');
    const [recipientSearch, setRecipientSearch] = useState('');
    const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const folders = [
        { id: 'inbox' as const, label: t('messages.folders.inbox'), icon: Inbox },
        { id: 'sent' as const, label: t('messages.folders.sent'), icon: Send },
        { id: 'archive' as const, label: t('messages.folders.archive'), icon: Archive },
    ];

    // Filter messages based on folder and search
    const filteredMessages = messages.filter(msg => {
        const matchesSearch = msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.senderName.toLowerCase().includes(searchQuery.toLowerCase());

        if (selectedFolder === 'inbox') {
            return msg.receiverId === user?.id && !msg.archived && matchesSearch;
        } else if (selectedFolder === 'sent') {
            return msg.senderId === user?.id && !msg.archived && matchesSearch;
        } else if (selectedFolder === 'archive') {
            return (msg.receiverId === user?.id || msg.senderId === user?.id) && msg.archived && matchesSearch;
        }
        return matchesSearch;
    });

    const handleArchiveMessage = async (messageId: string | number) => {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        // Toggle archive status
        await updateMessage(messageId, { archived: !message.archived });

        // If we archived the currently selected message and we're in inbox/sent, deselect it
        if (message.archived === false && selectedMessage?.id === messageId && selectedFolder !== 'archive') {
            setSelectedMessage(null);
        }
    };

    // Filter recipients based on search
    const filteredRecipients = (() => {
        const allRecipients = [
            // All users option
            { type: 'all' as const, id: 'all', label: `👥 ${t('messages.allUsers')}`, searchText: t('messages.allUsers').toLowerCase(), relatedIds: [] as string[] },
            // Individual users with enhanced parent labels
            ...users.map(u => {
                let label = '';
                let searchText = '';
                const relatedIds: string[] = [];

                if (u.role === 'parent') {
                    // For parents, show "Parent de [enfants]"
                    const parent = u as any;
                    const children = users.filter(child =>
                        child.role === 'student' && parent.childrenIds?.includes(child.id)
                    );
                    const childrenNames = children.map(c => c.name).join(', ');
                    label = `👨‍👩‍👧 ${t('messages.parentOf')} ${childrenNames || t('roles.student')}`;
                    searchText = `${t('messages.parentOf')} ${childrenNames} ${u.name}`.toLowerCase();
                    relatedIds.push(...children.map(c => c.id));
                } else if (u.role === 'student') {
                    // For students, show their name
                    const student = u as any;
                    label = `🎓 ${u.name}`;
                    searchText = `${u.name} ${t('roles.student')}`.toLowerCase();
                    // Add parent ID to related IDs
                    if (student.parentId) {
                        relatedIds.push(student.parentId);
                    }
                } else {
                    // Other roles (teachers, directors, etc.)
                    const roleEmoji = u.role === 'teacher' ? '👨‍🏫' : u.role === 'director' ? '👔' : '👤';
                    const roleName = t(`roles.${u.role}`);
                    label = `${roleEmoji} ${u.name} (${roleName})`;
                    searchText = `${u.name} ${roleName}`.toLowerCase();
                }

                return {
                    type: 'user' as const,
                    id: u.id,
                    label,
                    searchText,
                    relatedIds
                };
            }),
            // Classes
            ...classes.map(c => ({
                type: 'class' as const,
                id: c.id,
                label: `🏫 ${c.name}`,
                searchText: `${c.name} ${t('common.classes')}`.toLowerCase(),
                relatedIds: [] as string[]
            }))
        ];

        // Filter based on search query
        return allRecipients.filter(item => {
            if (recipientSearch === '' && item.type === 'all') return true;
            if (recipientSearch === '') return true;

            const query = recipientSearch.toLowerCase();

            // Match by search text
            if (item.searchText.includes(query)) return true;

            // Also include items that are related to matching items
            // For example, if searching for a student, show their parent too
            const matchingItems = allRecipients.filter(other =>
                other.searchText.includes(query)
            );

            for (const matching of matchingItems) {
                if (matching.relatedIds.includes(item.id)) {
                    return true;
                }
            }

            return false;
        });
    })();

    const selectedRecipientLabel = recipient
        ? filteredRecipients.find(r => r.id === recipient)?.label || recipientSearch
        : '';

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
        setContent(`\n\n---\nLe ${new Date(msg.timestamp).toLocaleDateString()} à ${new Date(msg.timestamp).toLocaleTimeString()}, ${msg.senderName} a écrit:\n> ${msg.content.split('\n').join('\n> ')}`);
        setAttachments([]);
        setIsComposeOpen(true);
    };

    const handleForward = (msg: Message) => {
        setComposeMode('forward');
        setRecipient('');
        setSubject(`Fwd: ${msg.subject}`);
        setContent(`\n\n---\nMessage transféré de ${msg.senderName}:\n\n${msg.content}`);
        setAttachments([]); // Could optionally copy attachments here
        setIsComposeOpen(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = () => {
        if (!user || !recipient || !subject || !content) return;

        const selectedRecipient = filteredRecipients.find(r => r.id === recipient);

        // Mock upload - convert files to fake URLs
        const attachmentUrls = attachments.map(file => URL.createObjectURL(file)); // In real app, upload to storage and get URL

        // If sending to a class, send individual messages to all students + teacher
        if (selectedRecipient?.type === 'class') {
            const selectedClass = classes.find(c => c.id === recipient);
            if (selectedClass) {
                // Get all students in the class
                const classStudents = users.filter(u =>
                    u.role === 'student' && (u as any).classId === selectedClass.id
                );

                // Get the class teacher
                const classTeacher = users.find(u => u.id === selectedClass.teacherId);

                // Send message to all students
                classStudents.forEach(student => {
                    sendMessage({
                        senderId: user.id,
                        senderName: user.name,
                        senderRole: user.role,
                        receiverId: student.id,
                        subject: `[${selectedClass.name}] ${subject}`,
                        content,
                        read: false,
                        type: 'group',
                        attachments: attachmentUrls
                    });
                });

                // Send message to teacher
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
                        attachments: attachmentUrls
                    });
                }
            }
        } else {
            // Individual or broadcast message
            sendMessage({
                senderId: user.id,
                senderName: user.name,
                senderRole: user.role,
                receiverId: recipient,
                subject,
                content,
                read: false,
                type: recipient === 'all' ? 'broadcast' : 'individual',
                attachments: attachmentUrls
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
    };

    const handleDeleteMessage = (msgId: string | number) => {
        deleteMessage(msgId);
        if (selectedMessage?.id === msgId) {
            setSelectedMessage(null);
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            <Card className="flex-1 flex overflow-hidden !p-0 border-0 shadow-xl">
                {/* Left Sidebar - Folders */}
                <div className="w-64 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 flex flex-col">
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <Inbox size={18} />
                            </div>
                            <span className="font-bold text-gray-800 dark:text-white">SmartMadrasa</span>
                        </div>
                        <Button className="w-full justify-start mb-6" icon={PenSquare} onClick={handleComposeNew}>
                            {t('messages.newMessage')}
                        </Button>
                        <nav className="space-y-1">
                            {folders.map((folder) => (
                                <button
                                    key={folder.id}
                                    onClick={() => setSelectedFolder(folder.id)}
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

                {/* Middle Column - Message List */}
                <div className="w-80 bg-gray-50/50 dark:bg-slate-900 border-r border-gray-100 dark:border-slate-700 flex flex-col">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <h2 className="font-bold text-lg text-gray-800 dark:text-white mb-1">
                            {folders.find(f => f.id === selectedFolder)?.label}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">{filteredMessages.length} {t('messages.message').toLowerCase()}{filteredMessages.length !== 1 ? 's' : ''}</p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                                <input
                                    type="text"
                                    placeholder={t('messages.searchPlaceholder')}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-slate-700 border-none rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/30 outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="p-2 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredMessages.map((msg) => (
                            <div
                                key={msg.id}
                                onClick={() => handleSelectMessage(msg)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${selectedMessage?.id === msg.id
                                    ? 'bg-orange-50 border-l-4 border-l-orange-500'
                                    : 'hover:bg-white'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${selectedMessage?.id === msg.id ? 'bg-orange-500' : 'bg-gray-400'
                                            }`}>
                                            {msg.senderName.charAt(0)}
                                        </div>
                                        <span className={`text-sm font-semibold ${selectedMessage?.id === msg.id ? 'text-orange-900' : 'text-gray-900'
                                            }`}>
                                            {msg.senderName}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(msg.timestamp).toLocaleDateString(i18n.language)}
                                    </span>
                                </div>
                                <h3 className={`text-sm mb-1 ${!msg.read ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                    {msg.subject}
                                </h3>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                    {msg.content}
                                </p>
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                                        <Paperclip size={12} />
                                        <span>{msg.attachments.length} {t('messages.attachments').toLowerCase()}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column - Message Detail */}
                <div className="flex-1 bg-white dark:bg-slate-800 flex flex-col">
                    {selectedMessage ? (
                        <>
                            {/* Toolbar */}
                            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                <div className="flex gap-2">
                                    <button
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                        onClick={() => handleReply(selectedMessage)}
                                        title={t('messages.reply')}
                                    >
                                        <ReplyIcon size={18} />
                                    </button>
                                    <button
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                        onClick={() => handleForward(selectedMessage)}
                                        title={t('messages.forward')}
                                    >
                                        <ForwardIcon size={18} />
                                    </button>
                                    <button
                                        className={`p-2 transition-colors rounded-lg ${selectedMessage.archived
                                            ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                            : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                                            }`}
                                        onClick={() => handleArchiveMessage(selectedMessage.id)}
                                        title={selectedMessage.archived ? "Désarchiver" : t('messages.archive')}
                                    >
                                        <Archive size={18} />
                                    </button>
                                    <button
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        onClick={() => handleDeleteMessage(selectedMessage.id)}
                                        title={t('common.delete')}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-8 overflow-y-auto">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                                            {selectedMessage.senderName.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedMessage.senderName}</h2>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">{selectedMessage.senderRole}@smartmadrassa.com</p>
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-slate-400">
                                        {new Date(selectedMessage.timestamp).toLocaleString(i18n.language)}
                                    </span>
                                </div>

                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{selectedMessage.subject}</h1>

                                <div className="prose prose-orange max-w-none text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-8">
                                    {selectedMessage.content}
                                </div>

                                {/* Attachments Display */}
                                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                                    <div className="border-t pt-6">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Paperclip size={16} />
                                            {t('messages.attachments')} ({selectedMessage.attachments.length})
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedMessage.attachments.map((url, index) => (
                                                <a
                                                    key={index}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group"
                                                >
                                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-orange-500 shadow-sm">
                                                        <File size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                                            {t('messages.attachments')} {index + 1}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{t('messages.clickToOpen')}</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                            <Inbox size={48} className="mb-4 opacity-20" />
                            <p>{t('messages.selectMessage')}</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Compose Modal */}
            <Modal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {composeMode === 'reply' ? t('messages.reply') : composeMode === 'forward' ? t('messages.forward') : t('messages.newMessage')}
                        </h2>
                        <button onClick={() => setIsComposeOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('messages.recipient')}</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={recipient ? selectedRecipientLabel : recipientSearch}
                                    onChange={(e) => {
                                        setRecipientSearch(e.target.value);
                                        setRecipient('');
                                        setShowRecipientDropdown(true);
                                    }}
                                    onFocus={() => setShowRecipientDropdown(true)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                    placeholder={t('messages.searchRecipientPlaceholder')}
                                    disabled={composeMode === 'reply'}
                                />
                                {showRecipientDropdown && !recipient && filteredRecipients.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {filteredRecipients.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    setRecipient(item.id.toString());
                                                    setRecipientSearch('');
                                                    setShowRecipientDropdown(false);
                                                }}
                                                className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-center gap-2 border-b border-gray-100 last:border-0"
                                            >
                                                <span className="text-sm">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Input
                            label={t('messages.subject')}
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder={t('messages.subjectPlaceholder')}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('messages.message')}</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none resize-none"
                                placeholder={t('messages.messagePlaceholder')}
                            />
                        </div>

                        {/* Attachments Section */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">{t('messages.attachments')}</label>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                                >
                                    <Paperclip size={16} />
                                    {t('messages.addAttachment')}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    multiple
                                />
                            </div>

                            {attachments.length > 0 && (
                                <div className="space-y-2">
                                    {attachments.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <File size={16} className="text-gray-500 flex-shrink-0" />
                                                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                                <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                            </div>
                                            <button
                                                onClick={() => removeAttachment(index)}
                                                className="text-gray-400 hover:text-red-500 p-1"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setIsComposeOpen(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button variant="primary" onClick={handleSendMessage} icon={Send}>
                                {t('messages.send')}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Messages;
