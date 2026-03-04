import { useRef, useCallback } from 'react';

/**
 * Hook that throttles a callback function — prevents it from being called
 * more than once within the specified delay period.
 *
 * @param callback - The function to throttle
 * @param delayMs - Minimum time between calls in milliseconds
 * @returns A throttled version of the callback
 *
 * @example
 * const throttledSend = useThrottle(sendMessage, 2000);
 * // throttledSend() can only fire once every 2 seconds
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delayMs: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
    const lastCallRef = useRef<number>(0);
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    return useCallback(
        (...args: Parameters<T>): ReturnType<T> | undefined => {
            const now = Date.now();
            if (now - lastCallRef.current >= delayMs) {
                lastCallRef.current = now;
                return callbackRef.current(...args) as ReturnType<T>;
            }
            return undefined;
        },
        [delayMs]
    );
}
