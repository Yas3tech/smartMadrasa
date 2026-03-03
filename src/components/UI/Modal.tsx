import { useEffect, useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
    const { t } = useTranslation();
    const titleId = useId();

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
        >
            <div
                className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
                {title && (
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                        <h3 id={titleId} className="font-bold text-lg text-gray-800 dark:text-slate-100">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            aria-label={t('common.close')}
                            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                            &times;
                        </button>
                    </div>
                )}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
            </div>
        </div>
    );
};
