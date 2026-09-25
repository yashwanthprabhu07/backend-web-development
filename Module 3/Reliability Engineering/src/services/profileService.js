const DEFAULT_AVATAR = {
  url: 'https://cdn.aurora-profiles.dev/avatars/default.png',
  initials: '?',
  source: 'fallback',
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryable(error) {
  // Retry timeout/abort errors
  if (error?.name === 'AbortError') {
    return true;
  }

  // Retry network errors with no HTTP status
  if (error?.status === undefined || error?.status === null) {
    return true;
  }

  // Retry 429
  if (error.status === 429) {
    return true;
  }

  // Retry 5xx server errors
  if (error.status >= 500 && error.status <= 599) {
    return true;
  }

  // Do not retry other 4xx errors
  return false;
}

async function withTimeout(operation, timeoutMs) {
  const controller = new AbortController();

  let timer;

  try {
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();

        const error = new Error('Operation timed out');
        error.name = 'AbortError';

        reject(error);
      }, timeoutMs);
    });

    const operationPromise = operation(controller.signal);

    return await Promise.race([
      operationPromise,
      timeoutPromise,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function withRetry(operation, options = {}) {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 25;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Stop immediately for non-retryable errors
      if (!isRetryable(error)) {
        throw error;
      }

      // Stop after the final attempt
      if (attempt === maxAttempts) {
        throw error;
      }

      // Exponential backoff
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
}

async function getProfileWithAvatar(authorId, avatarClient, options = {}) {
  const timeoutMs = options.timeoutMs ?? 200;
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 25;

  try {
    const avatar = await withRetry(
      () =>
        withTimeout(
          signal => avatarClient.getAvatar(authorId, { signal }),
          timeoutMs
        ),
      {
        maxAttempts,
        baseDelayMs,
      }
    );

    return {
      authorId,
      avatar,
      degraded: false,
    };
  } catch (error) {
    return {
      authorId,
      avatar: DEFAULT_AVATAR,
      degraded: true,
    };
  }
}

module.exports = {
  DEFAULT_AVATAR,
  sleep,
  isRetryable,
  withTimeout,
  withRetry,
  getProfileWithAvatar,
};

