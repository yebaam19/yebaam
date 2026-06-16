export function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const maybeAxiosError = error as {
      response?: { data?: { message?: unknown } }
      message?: unknown
    }

    if (typeof maybeAxiosError.response?.data?.message === 'string') {
      return maybeAxiosError.response.data.message
    }

    if (typeof maybeAxiosError.message === 'string') {
      return maybeAxiosError.message
    }
  }

  return fallback
}
