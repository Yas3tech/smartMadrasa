import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
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

// Mock LucideIcon since it's just a component
const MockIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg data-testid="mock-icon" width={size} height={size} className={className}></svg>
);

describe('LoadingStates Components', () => {
  describe('SkeletonCard', () => {
    it('should render with animate-pulse class', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.firstChild).toHaveClass('animate-pulse');
      expect(container.firstChild).toHaveClass('bg-white');
      expect(container.firstChild).toHaveClass('rounded-2xl');
    });
  });

  describe('SkeletonText', () => {
    it('should render default number of lines (3)', () => {
      const { container } = render(<SkeletonText />);
      // The outer container has space-y-3
      expect(container.firstChild).toHaveClass('space-y-3');
      // Count children
      expect(container.firstChild?.childNodes.length).toBe(3);
    });

    it('should render custom number of lines', () => {
      const { container } = render(<SkeletonText lines={5} />);
      expect(container.firstChild?.childNodes.length).toBe(5);
    });
  });

  describe('SkeletonTable', () => {
    it('should render default number of rows (5)', () => {
      const { container } = render(<SkeletonTable />);
      expect(container.firstChild?.childNodes.length).toBe(5);
    });

    it('should render custom number of rows', () => {
      const { container } = render(<SkeletonTable rows={10} />);
      expect(container.firstChild?.childNodes.length).toBe(10);
    });
  });

  describe('SkeletonChart', () => {
    it('should render without crashing', () => {
      const { container } = render(<SkeletonChart />);
      expect(container.firstChild).toHaveClass('animate-pulse');
      // Check for inner shimmer
      const shimmer = container.querySelector('.animate-shimmer');
      expect(shimmer).toBeInTheDocument();
    });
  });

  describe('Spinner', () => {
    it('should render with default size (md)', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status', { name: /loading/i });
      expect(spinner).toHaveClass('w-8 h-8');
    });

    it('should render with small size', () => {
      render(<Spinner size="sm" />);
      const spinner = screen.getByRole('status', { name: /loading/i });
      expect(spinner).toHaveClass('w-4 h-4');
    });

    it('should render with large size', () => {
      render(<Spinner size="lg" />);
      const spinner = screen.getByRole('status', { name: /loading/i });
      expect(spinner).toHaveClass('w-12 h-12');
    });

    it('should accept custom className', () => {
      render(<Spinner className="text-red-500" />);
      const spinner = screen.getByRole('status', { name: /loading/i });
      expect(spinner).toHaveClass('text-red-500');
    });
  });

  describe('LoadingOverlay', () => {
    it('should render with default message', () => {
      render(<LoadingOverlay />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<LoadingOverlay message="Please wait..." />);
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });
  });

  describe('PageLoader', () => {
    it('should render multiple skeleton components', () => {
      const { container } = render(<PageLoader />);
      // Should contain multiple skeleton cards
      // The PageLoader has a grid with 4 SkeletonCards
      // We can check for the structure or just ensure it renders
      expect(container.firstChild).toHaveClass('space-y-6');
    });
  });

  describe('EmptyState', () => {
    it('should render title and description', () => {
      render(<EmptyState title="No Data" description="There is no data to display" />);
      expect(screen.getByText('No Data')).toBeInTheDocument();
      expect(screen.getByText('There is no data to display')).toBeInTheDocument();
    });

    it('should render icon if provided', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<EmptyState title="No Data" icon={MockIcon as any} />);
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('should render action if provided', () => {
      render(<EmptyState title="No Data" action={<button>Retry</button>} />);
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('ShimmerEffect', () => {
    it('should render with animate-shimmer class', () => {
      const { container } = render(<ShimmerEffect />);
      const shimmer = container.querySelector('.animate-shimmer');
      expect(shimmer).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(<ShimmerEffect className="h-10" />);
      expect(container.firstChild).toHaveClass('h-10');
    });
  });
});
