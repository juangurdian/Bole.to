/**
 * Retry utilities with exponential backoff and circuit breaker patterns
 */

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter?: boolean;
  retryIf?: (error: any) => boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export class CircuitBreakerError extends Error {
  constructor(message: string = 'Circuit breaker is open') {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Circuit breaker state
 */
enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new CircuitBreakerError();
      }
      // Transition to half-open
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.options.resetTimeout;
    }
  }

  getState(): string {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }

  reset(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
    this.nextAttemptTime = 0;
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    initialDelay,
    maxDelay,
    backoffFactor,
    jitter = true,
    retryIf
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      if (retryIf && !retryIf(error)) {
        throw error;
      }

      // Don't delay on the last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      console.log(`Retry attempt ${attempt} failed, retrying in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }

  throw new RetryError(
    `Operation failed after ${maxAttempts} attempts`,
    maxAttempts,
    lastError!
  );
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Common retry configurations
 */
export const RetryConfigs = {
  // For network requests
  network: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitter: true,
    retryIf: (error: any) => {
      // Retry on network errors, timeouts, and 5xx errors
      return (
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT' ||
        (error.status >= 500 && error.status < 600)
      );
    }
  },

  // For authentication operations
  auth: {
    maxAttempts: 2,
    initialDelay: 500,
    maxDelay: 2000,
    backoffFactor: 2,
    jitter: true,
    retryIf: (error: any) => {
      // Don't retry on auth errors (401, 403) or validation errors (400)
      return (
        error.status !== 401 &&
        error.status !== 403 &&
        error.status !== 400 &&
        error.code !== 'INVALID_CREDENTIALS'
      );
    }
  },

  // For critical operations that must succeed
  critical: {
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 30000,
    backoffFactor: 2,
    jitter: true,
    retryIf: (error: any) => {
      // Retry everything except explicit user errors
      return error.status !== 400 && error.code !== 'USER_ERROR';
    }
  }
};

/**
 * Circuit breaker configurations
 */
export const CircuitBreakerConfigs = {
  // For API endpoints
  api: {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 30000 // 30 seconds
  },

  // For authentication services
  auth: {
    failureThreshold: 3,
    resetTimeout: 30000, // 30 seconds
    monitoringPeriod: 15000 // 15 seconds
  }
};

/**
 * Check if an error is retryable based on common patterns
 */
export function isRetryableError(error: any): boolean {
  // Network connectivity errors
  if (
    error.code === 'NETWORK_ERROR' ||
    error.code === 'TIMEOUT' ||
    error.message?.includes('network') ||
    error.message?.includes('timeout')
  ) {
    return true;
  }

  // HTTP 5xx server errors
  if (error.status >= 500 && error.status < 600) {
    return true;
  }

  // Rate limiting (429)
  if (error.status === 429) {
    return true;
  }

  // Specific error codes that are retryable
  const retryableCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN'
  ];

  if (retryableCodes.includes(error.code)) {
    return true;
  }

  return false;
}

/**
 * Check if an error indicates network connectivity issues
 */
export function isNetworkError(error: any): boolean {
  return (
    error.code === 'NETWORK_ERROR' ||
    error.message?.includes('network') ||
    error.message?.includes('offline') ||
    error.message?.includes('no internet') ||
    ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN'].includes(error.code)
  );
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return (
    error.status === 401 ||
    error.status === 403 ||
    error.code === 'INVALID_CREDENTIALS' ||
    error.code === 'TOKEN_EXPIRED' ||
    error.code === 'UNAUTHORIZED'
  );
}