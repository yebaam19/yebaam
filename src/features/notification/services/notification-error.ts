function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}

export function notificationError(error: unknown) {
  const details = record(error);
  const response = record(details?.response);
  const data = record(response?.data);
  const message = data?.message ?? details?.message;
  return {
    message: typeof message === 'string' ? message : '',
    status: typeof response?.status === 'number' ? response.status : undefined,
  };
}
