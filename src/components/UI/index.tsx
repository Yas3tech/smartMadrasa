import React, { type ReactNode, useId } from 'react';
import { Spinner } from './LoadingStates';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
}

export const Card = ({ children, className = '', onClick, id }: CardProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      if (e.key === ' ') e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      id={id}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-soft ${
        onClick
          ? 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

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

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
}

export const Badge = ({ children, variant = 'neutral', className = '' }: BadgeProps) => {
  const variants = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
}

export const Input = ({ label, error, icon: Icon, className = '', ...props }: InputProps) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  const errorId = `${inputId}-error`;

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
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
        {title && (
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-lg text-gray-800 dark:text-slate-100">{title}</h3>
            <button
              onClick={onClose}
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

// Export LoadingStates components
export {
  SkeletonCard,
  SkeletonText,
  SkeletonTable,
  SkeletonChart,
  Spinner,
  LoadingOverlay,
  PageLoader,
  EmptyState,
  ShimmerEffect,
} from './LoadingStates';

// Export FileUpload component
export { FileUpload } from './FileUpload';
