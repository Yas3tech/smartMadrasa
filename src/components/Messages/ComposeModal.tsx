import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button } from '../UI';
import { X, Paperclip, File, Send } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  composeMode: 'new' | 'reply' | 'forward';
  recipient: string;
  setRecipient: (val: string) => void;
  recipientSearch: string;
  setRecipientSearch: (val: string) => void;
  showRecipientDropdown: boolean;
  setShowRecipientDropdown: (val: boolean) => void;
  filteredRecipients: Array<{ id: string; label: string; type: string }>;
  recipientSearchMinChars: number;
  selectedRecipientLabel: string;
  subject: string;
  setSubject: (val: string) => void;
  content: string;
  setContent: (val: string) => void;
  attachments: File[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (index: number) => void;
  handleSendMessage: () => void | Promise<void>;
  isSending: boolean;
}

const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  composeMode,
  recipient,
  setRecipient,
  recipientSearch,
  setRecipientSearch,
  showRecipientDropdown,
  setShowRecipientDropdown,
  filteredRecipients,
  recipientSearchMinChars,
  selectedRecipientLabel,
  subject,
  setSubject,
  content,
  setContent,
  attachments,
  fileInputRef,
  handleFileSelect,
  removeAttachment,
  handleSendMessage,
  isSending,
}) => {
  const { t, i18n } = useTranslation();
  const recipientSearchLength = recipientSearch.trim().length;
  const showMinCharsHint =
    composeMode !== 'reply' &&
    !recipient &&
    showRecipientDropdown &&
    recipientSearchLength > 0 &&
    recipientSearchLength < recipientSearchMinChars;
  const minCharsHint = i18n.language.startsWith('nl')
    ? `Typ minstens ${recipientSearchMinChars} tekens.`
    : i18n.language.startsWith('ar')
      ? `اكتب ${recipientSearchMinChars} احرف على الاقل.`
      : `Tapez au moins ${recipientSearchMinChars} caracteres.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label={t('common.close')}
            disabled={isSending}
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label htmlFor="compose-recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('messages.recipient')}
            </label>
            <input
              id="compose-recipient"
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
              disabled={composeMode === 'reply' || isSending}
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
            {showMinCharsHint && <p className="mt-2 text-xs text-gray-500">{minCharsHint}</p>}
          </div>

          <Input
            label={t('messages.subject')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('messages.subjectPlaceholder')}
            disabled={isSending}
          />

          <div>
            <label htmlFor="compose-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('messages.message')}
            </label>
            <textarea
              id="compose-message"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none resize-none"
              placeholder={t('messages.messagePlaceholder')}
              disabled={isSending}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('messages.attachments')}
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                disabled={isSending}
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
                disabled={isSending}
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
                      aria-label={t('common.delete')}
                      disabled={isSending}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={onClose} disabled={isSending}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSendMessage}
              icon={Send}
              isLoading={isSending}
            >
              {t('messages.send')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ComposeModal;
