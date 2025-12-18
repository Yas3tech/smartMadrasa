import { useTranslation } from 'react-i18next';
import { Modal, Button } from '../UI';
import { X, Upload, File as FileIcon, Trash2, Check } from 'lucide-react';
import type { Homework, SubmissionFile } from '../../types';

interface SubmitHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  homework: Homework | null;
  submissionContent: string;
  setSubmissionContent: (content: string) => void;
  selectedFiles: File[];
  existingFiles: SubmissionFile[];
  setExistingFiles: (files: SubmissionFile[]) => void;
  uploadProgress: Record<string, number>;
  uploadingFiles: boolean;
  onSubmit: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  formatFileSize: (bytes: number) => string;
  existingSubmission?: { content?: string; files?: SubmissionFile[] };
}

export function SubmitHomeworkModal({
  isOpen,
  onClose,
  homework,
  submissionContent,
  setSubmissionContent,
  selectedFiles,
  existingFiles,
  setExistingFiles,
  uploadProgress,
  uploadingFiles,
  onSubmit,
  onFileSelect,
  onRemoveFile,
  formatFileSize,
  existingSubmission,
}: SubmitHomeworkModalProps) {
  const { t, i18n } = useTranslation();

  if (!homework) return null;

  const handleRemoveExistingFile = (index: number) => {
    setExistingFiles(existingFiles.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{homework.title}</h2>
            <p className="text-sm text-gray-500">{homework.subject}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Homework Details */}
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            <strong>{t('homework.dueDate')}:</strong>{' '}
            {new Date(homework.dueDate).toLocaleDateString(i18n.language)}
          </p>
          {homework.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{homework.description}</p>
          )}
          {homework.maxGrade && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <strong>{t('homework.maxGrade')}:</strong> {homework.maxGrade} pts
            </p>
          )}
        </div>

        {/* Answer Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('homework.yourAnswer')}
            </label>
            <textarea
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
              placeholder={t('homework.form.answerPlaceholder')}
            />
          </div>

          {/* Existing Files (for modifications) */}
          {existingFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('homework.existingFiles')}
              </label>
              <div className="space-y-2">
                {existingFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({t('homework.alreadyUploaded')})
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveExistingFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('homework.attachFiles')} ({t('homework.maxFileSize')})
            </label>
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-orange-400 transition-colors">
              <Upload size={20} className="text-gray-400" />
              <span className="text-sm text-gray-500">{t('homework.form.attachFileHelp')}</span>
              <input type="file" multiple onChange={onFileSelect} className="hidden" />
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileIcon size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                  </div>
                  {uploadProgress[file.name] !== undefined ? (
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => onRemoveFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onClose} disabled={uploadingFiles}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={onSubmit} disabled={uploadingFiles}>
              {uploadingFiles
                ? t('common.loading')
                : existingSubmission
                  ? t('common.save')
                  : t('homework.submit')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default SubmitHomeworkModal;
