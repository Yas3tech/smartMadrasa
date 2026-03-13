import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Archive,
  Trash2,
  Paperclip,
  File,
  Inbox,
} from 'lucide-react';
import { isSafeUrl } from '../../utils/security';
import type { Message } from '../../types';

interface MessageDetailProps {
  isMobile: boolean;
  mobileView: 'folders' | 'list' | 'detail';
  setMobileView: (view: 'folders' | 'list' | 'detail') => void;
  selectedMessage: Message | null;
  handleReply: (msg: Message) => void;
  handleForward: (msg: Message) => void;
  handleArchiveMessage: (id: string | number) => void;
  handleDeleteMessage: (id: string | number) => void;
}

const MessageDetail: React.FC<MessageDetailProps> = ({
  isMobile,
  mobileView,
  setMobileView,
  selectedMessage,
  handleReply,
  handleForward,
  handleArchiveMessage,
  handleDeleteMessage,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div
      className={`${
        isMobile
          ? mobileView === 'detail'
            ? 'flex-1 w-full bg-white dark:bg-slate-800 flex flex-col'
            : 'hidden'
          : 'flex-1 bg-white dark:bg-slate-800 flex flex-col'
      }`}
    >
      {selectedMessage ? (
        <>
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {isMobile && (
                <button
                  onClick={() => setMobileView('list')}
                  className="p-2 mr-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  aria-label={t('common.back')}
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              <div className="flex gap-2">
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  onClick={() => handleReply(selectedMessage)}
                  title={t('messages.reply')}
                  aria-label={t('messages.reply')}
                >
                  <ReplyIcon size={18} />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  onClick={() => handleForward(selectedMessage)}
                  title={t('messages.forward')}
                  aria-label={t('messages.forward')}
                >
                  <ForwardIcon size={18} />
                </button>
                <button
                  className={`p-2 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                    selectedMessage.archived
                      ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                      : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => handleArchiveMessage(selectedMessage.id)}
                  title={selectedMessage.archived ? t('messages.unarchive') : t('messages.archive')}
                  aria-label={
                    selectedMessage.archived ? t('messages.unarchive') : t('messages.archive')
                  }
                >
                  <Archive size={18} />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  title={t('common.delete')}
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {selectedMessage.senderName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedMessage.senderName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {selectedMessage.senderEmail ||
                      `${selectedMessage.senderRole}@smartmadrassa.com`}
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500 dark:text-slate-400">
                {new Date(selectedMessage.timestamp).toLocaleString(i18n.language)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {selectedMessage.subject}
            </h1>
            <div className="prose prose-orange max-w-none text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-8">
              {selectedMessage.content}
            </div>
            {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Paperclip size={16} />
                  {t('messages.attachments')} ({selectedMessage.attachments.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedMessage.attachments.filter(isSafeUrl).map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-orange-500 shadow-sm">
                        <File size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
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
  );
};

export default MessageDetail;
