import React, { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ElementType;
}

export const Input = ({ label, error, icon: Icon, className = '', ...props }: InputProps) => {
    const { t } = useTranslation();
    const generatedId = useId();
    const inputId = props.id || generatedId;
    const errorId = `${inputId}-error`;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = props.type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : props.type;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    id={inputId}
                    aria-invalid={!!error}
                    aria-describedby={error ? errorId : undefined}
                    className={`w-full ${Icon ? 'pl-10' : 'px-4'} ${isPassword ? 'pr-10' : ''} py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''} ${className}`}
                    {...props}
                    type={inputType}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:rounded-md focus:text-orange-600"
                        aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {error && (
                <p id={errorId} className="mt-1 text-xs text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
};
