import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './index';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles onClick event', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Clickable Card</Card>);

    const card = screen.getByText('Clickable Card');
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is accessible when clickable', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Accessible Card</Card>);

    const card = screen.getByText('Accessible Card');

    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('triggers onClick with Enter key', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Keyboard Card</Card>);

    const card = screen.getByText('Keyboard Card');
    card.focus();
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('triggers onClick with Space key', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Keyboard Card</Card>);

    const card = screen.getByText('Keyboard Card');
    card.focus();
    fireEvent.keyDown(card, { key: ' ', code: 'Space' });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
