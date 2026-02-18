import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from './index';

describe('Input', () => {
  it('associates label with input', () => {
    render(<Input label="Email" />);
    // This should pass if the label is correctly associated with the input
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('associates error message with input via aria-describedby', () => {
    render(<Input label="Email" error="Invalid email" />);
    const input = screen.getByLabelText('Email');
    const errorMessage = screen.getByText('Invalid email');

    expect(input).toHaveAttribute('aria-describedby', errorMessage.id);
    expect(errorMessage.id).toBeTruthy();
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input label="Email" error="Invalid email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('uses provided id if available', () => {
    render(<Input label="Email" id="my-email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'my-email');
  });
});
