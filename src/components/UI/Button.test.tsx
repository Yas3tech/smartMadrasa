import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './index';

// Mock LucideIcon since it's just a component
const MockIcon = ({ size }: { size?: number }) => (
  <svg data-testid="mock-icon" width={size} height={size}></svg>
);

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles onClick', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders icon if provided', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<Button icon={MockIcon as any}>Icon Button</Button>);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-red-50');
  });

  it('applies size classes', () => {
    const { container } = render(<Button size="sm">Small</Button>);
    expect(container.firstChild).toHaveClass('px-3');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled').closest('button')).toBeDisabled();
  });

  // New features
  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('is disabled when isLoading is true', () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Loading
      </Button>
    );

    const button = screen.getByText('Loading').closest('button');
    expect(button).toBeDisabled();

    fireEvent.click(button!);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not show icon when isLoading is true', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(
      <Button isLoading icon={MockIcon as any}>
        Loading
      </Button>
    );
    expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
  });
});
