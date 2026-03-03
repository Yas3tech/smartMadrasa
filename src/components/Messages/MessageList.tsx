import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, ChevronLeft, Paperclip } from 'lucide-react';
import type { Message } from '../../types';

interface MessageListProps {
    isMobile: boolean;
    mobileView: 'folders' | 'list' | 'detail';
    setMobileView: (view: 'folders' | 'list' | 'detail') => void;
    selectedFolder: 'inbox' | 'sent' | 'archive';
    folders: Array<{ id: string; label: string }>;
    filteredMessages: Message[];
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    handleSelectMessage: (msg: Message) => void;
    selectedMessage: Message | null;
}

const MessageList: React.FC<MessageListProps> = ({
    isMobile,
    mobileView,
    setMobileView,
    selectedFolder,
    folders,
    filteredMessages,
    searchQuery,
    setSearchQuery,
    handleSelectMessage,
    selectedMessage,
}) => {
    const { t, i18n } = useTranslation();

    return (
        <div
            className={`${isMobile
                ? mobileView === 'list'
                    ? 'flex-1 w-full bg-white dark:bg-slate-900'
                    : 'hidden'
                : 'w-80 bg-gray-50/50 dark:bg-slate-900 border-r border-gray-100 dark:border-slate-700 flex flex-col'
                }`}
        >
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2 mb-2">
                    {isMobile && (
                        <button
                            onClick={() => setMobileView('folders')}
                            className="p-1 mr-2 -ml-2 text-gray-500"
                            aria-label={t('common.back')}
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <div>
                        <h2 className="font-bold text-lg text-gray-800 dark:text-white">
                            {folders.find((f) => f.id === selectedFolder)?.label}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            {filteredMessages.length} {t('messages.message').toLowerCase()}
                            {filteredMessages.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder={t('messages.searchPlaceholder')}
                            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-slate-700 border-none rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/30 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        className="p-2 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                        aria-label={t('common.filter')}
                    >
                        <Filter size={18} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredMessages.map((message) => (
                    <div
                        key={message.id}
                        onClick={() => handleSelectMessage(message)}
                        className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${selectedMessage?.id === message.id
                            ? 'bg-orange-50 border-l-4 border-l-orange-500'
                            : 'hover:bg-white'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${selectedMessage?.id === message.id ? 'bg-orange-500' : 'bg-gray-400'}`}
                                >
                                    {message.senderName.charAt(0)}
                                </div>
                                <span
                                    className={`text-sm font-semibold ${selectedMessage?.id === message.id ? 'text-orange-900' : 'text-gray-900'}`}
                                >
                                    {message.senderName}
                                </span>
                            </div>
                            <span className="text-[10px] text-gray-400">
                                {new Date(message.timestamp).toLocaleDateString(i18n.language)}
                            </span>
                        </div>
                        <h3
                            className={`text-sm mb-1 ${!message.read ? 'font-bold text-gray-900' : 'text-gray-700'}`}
                        >
                            {message.subject}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                                <Paperclip size={12} />
                                <span>
                                    {message.attachments.length} {t('messages.attachments').toLowerCase()}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MessageList;
