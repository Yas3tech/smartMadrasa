import React, { type ReactNode } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card = ({ children, className = '', onClick, ...props }: CardProps) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            if (e.key === ' ') e.preventDefault();
            onClick();
        }
        props.onKeyDown?.(e);
    };

    return (
        <div
            {...props}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            role={props.role || (onClick ? 'button' : undefined)}
            tabIndex={props.tabIndex !== undefined ? props.tabIndex : (onClick ? 0 : undefined)}
            className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-soft ${onClick
                ? 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
                : ''
                } ${className}`}
        >
            {children}
        </div>
    );
};
