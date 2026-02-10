import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

// Skeleton Loader Components
export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${100 - i * 10}%` }}></div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl animate-pulse">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="w-20 h-8 bg-gray-200 rounded"></div>
      </div>
    ))}
  </div>
);

export const SkeletonChart = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
    <div className="h-64 bg-gray-100 rounded-xl relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"></div>
    </div>
  </div>
);

// Loading Spinner
export const Spinner = ({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`inline-block border-orange-500 border-t-transparent rounded-full animate-spin ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    ></div>
  );
};

// Loading Overlay
export const LoadingOverlay = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
      <Spinner size="lg" />
      <p className="text-gray-700 font-medium">{message}</p>
    </div>
  </div>
);

// Page Loading Skeleton
export const PageLoader = () => (
  <div className="space-y-6 p-6">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonChart />
    </div>
  </div>
);

// Empty State Component
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    {Icon && (
      <div className="mb-4 p-4 bg-gray-100 rounded-full">
        <Icon size={48} className="text-gray-400" />
      </div>
    )}
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    {description && <p className="text-gray-500 text-center max-w-md mb-6">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

// Shimmer Effect Component
export const ShimmerEffect = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-gray-200 via-gray-50 to-gray-200"></div>
  </div>
);

export default {
  SkeletonCard,
  SkeletonText,
  SkeletonTable,
  SkeletonChart,
  Spinner,
  LoadingOverlay,
  PageLoader,
  EmptyState,
  ShimmerEffect,
};
