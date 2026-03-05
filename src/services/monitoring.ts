interface MonitoringPayload {
  type: 'error' | 'unhandledrejection';
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  userAgent: string;
  url: string;
}

const endpoint = import.meta.env.VITE_ERROR_WEBHOOK_URL as string | undefined;

const isEndpointConfigured = Boolean(endpoint && endpoint.startsWith('https://'));

export const reportClientError = async (
  type: MonitoringPayload['type'],
  error: unknown,
  context?: Record<string, unknown>
) => {
  if (!isEndpointConfigured) return;

  const normalizedError =
    error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error), stack: undefined };

  const payload: MonitoringPayload = {
    type,
    message: normalizedError.message,
    stack: normalizedError.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  try {
    await fetch(endpoint!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Never break user flows if monitoring transport fails.
  }
};
