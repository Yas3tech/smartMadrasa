import React, { type ReactNode } from 'react';

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
