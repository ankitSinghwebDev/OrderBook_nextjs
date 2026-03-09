// Example utility function
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getApiErrorMessage(error, fallback = 'Something went wrong.') {
  if (!error) return fallback;

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (typeof error?.data === 'string' && error.data.trim()) {
    return error.data;
  }

  if (typeof error?.data?.message === 'string' && error.data.message.trim()) {
    return error.data.message;
  }

  if (typeof error?.error === 'string' && error.error.trim()) {
    return error.error;
  }

  if (
    typeof error?.message === 'string' &&
    error.message.trim() &&
    error.message !== 'Rejected'
  ) {
    return error.message;
  }

  return fallback;
}
