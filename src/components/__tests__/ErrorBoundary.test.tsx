/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error on render
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>Normal content</div>;
};

describe('ErrorBoundary', () => {
    beforeEach(() => {
        // Suppress React error boundary console.error noise in tests
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('renders children when there is no error', () => {
        render(
            <I18nextProvider i18n={i18n}>
                <ErrorBoundary>
                    <ThrowingComponent shouldThrow={false} />
                </ErrorBoundary>
            </I18nextProvider>
        );

        expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('renders fallback UI when a child component throws', () => {
        render(
            <I18nextProvider i18n={i18n}>
                <ErrorBoundary>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>
            </I18nextProvider>
        );

        expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
        expect(screen.getByText('Recharger la page')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
        render(
            <I18nextProvider i18n={i18n}>
                <ErrorBoundary fallback={<div>Custom fallback</div>}>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>
            </I18nextProvider>
        );

        expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });

    it('calls window.location.reload when reload button is clicked', () => {
        const reloadMock = vi.fn();
        Object.defineProperty(window, 'location', {
            value: { reload: reloadMock },
            writable: true,
        });

        render(
            <I18nextProvider i18n={i18n}>
                <ErrorBoundary>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>
            </I18nextProvider>
        );

        fireEvent.click(screen.getByText('Recharger la page'));
        expect(reloadMock).toHaveBeenCalled();
    });

    it('logs the error to console.error', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <I18nextProvider i18n={i18n}>
                <ErrorBoundary>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>
            </I18nextProvider>
        );

        expect(consoleSpy).toHaveBeenCalledWith(
            '[ErrorBoundary] Uncaught error:',
            expect.any(Error),
            expect.any(Object)
        );
    });
});
