import React from 'react';
import { Spinner } from './LoadingStates';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ElementType;
    isLoading?: boolean;
}

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    className = '',
    isLoading,
    ...props
}: ButtonProps) => {
    const baseStyles =
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
        primary:
            'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg',
        secondary:
            'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 shadow-sm',
        danger:
            'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-transparent',
        ghost:
            'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100/50 dark:hover:bg-slate-800',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const spinnerColors = {
        primary: '!border-white',
        secondary: '!border-orange-500',
        danger: '!border-red-600',
        ghost: '!border-gray-500',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <Spinner size="sm" className={spinnerColors[variant]} />
            ) : (
                Icon && <Icon size={size === 'sm' ? 16 : 18} />
            )}
            {children}
        </button>
    );
};
