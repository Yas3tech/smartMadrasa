/**
 * Messages Page - Refactored with useMessages hook
 *
 * Uses the useMessages hook for all business logic.
 * Contains UI for folder navigation, message list, and compose modal.
 */

import { useTranslation } from 'react-i18next';
import { Card, Button, Modal, Input } from '../../components/UI';
import { useMessages } from '../../hooks/useMessages';
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
  File,
  ChevronLeft,
} from 'lucide-react';

const Messages = () => {
  const { t, i18n } = useTranslation();
  const {
    selectedFolder,
    setSelectedFolder,
    filteredMessages,
    selectedMessage,
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
  } = useMessages();

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

        {/* Middle Column - Message List */}
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
              <button className="p-2 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
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

        {/* Right Column - Message Detail */}
        <div
          className={`${isMobile
            ? mobileView === 'detail'
              ? 'flex-1 w-full bg-white dark:bg-slate-800 flex flex-col'
              : 'hidden'
            : 'flex-1 bg-white dark:bg-slate-800 flex flex-col'
            }`}
        >
          {selectedMessage ? (
            <>
              {/* Toolbar */}
              <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {isMobile && (
                    <button
                      onClick={() => setMobileView('list')}
                      className="p-2 mr-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      <ChevronLeft size={24} />
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                      onClick={() => handleReply(selectedMessage)}
                      title={t('messages.reply')}
                    >
                      <ReplyIcon size={18} />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                      onClick={() => handleForward(selectedMessage)}
                      title={t('messages.forward')}
                    >
                      <ForwardIcon size={18} />
                    </button>
                    <button
                      className={`p-2 transition-colors rounded-lg ${selectedMessage.archived ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'}`}
                      onClick={() => handleArchiveMessage(selectedMessage.id)}
                      title={selectedMessage.archived ? 'Désarchiver' : t('messages.archive')}
                    >
                      <Archive size={18} />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      title={t('common.delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
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
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedMessage.senderName}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {selectedMessage.senderRole}@smartmadrassa.com
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
                      {selectedMessage.attachments.map((url, index) => (
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
      </Card>

      {/* Compose Modal */}
      <Modal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {composeMode === 'reply'
                ? t('messages.reply')
                : composeMode === 'forward'
                  ? t('messages.forward')
                  : t('messages.newMessage')}
            </h2>
            <button
              onClick={() => setIsComposeOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('messages.recipient')}
              </label>
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
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredRecipients.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setRecipient(item.id);
                        setRecipientSearch('');
                        setShowRecipientDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-orange-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 border-b border-gray-100 dark:border-slate-600 last:border-0"
                    >
                      <span className="text-sm text-gray-900 dark:text-white">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Input
              label={t('messages.subject')}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('messages.subjectPlaceholder')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('messages.message')}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none resize-none"
                placeholder={t('messages.messagePlaceholder')}
              />
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('messages.attachments')}
                </label>
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
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <File size={16} className="text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
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
