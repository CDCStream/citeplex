/**
 * Generic retry wrapper for async functions.
 * Retries the function up to `maxAttempts` times with optional delay between attempts.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: {
    label: string;
    maxAttempts?: number;
    delayMs?: number;
    /** Optional validation — if it returns false, the result is treated as a failure and retried. */
    validate?: (result: T) => boolean;
  },
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 2;
  const delayMs = opts.delayMs ?? 1500;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();

      if (opts.validate && !opts.validate(result)) {
        const msg = `[withRetry:${opts.label}] Attempt ${attempt}/${maxAttempts} — validation failed`;
        console.warn(msg);
        lastError = new Error(msg);
        if (attempt < maxAttempts) {
          await sleep(delayMs);
          continue;
        }
        throw lastError;
      }

      if (attempt > 1) {
        console.log(`[withRetry:${opts.label}] Succeeded on attempt ${attempt}/${maxAttempts}`);
      }
      return result;
    } catch (err) {
      lastError = err as Error;
      console.error(`[withRetry:${opts.label}] Attempt ${attempt}/${maxAttempts} failed:`, lastError.message);

      if (attempt < maxAttempts) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError ?? new Error(`[withRetry:${opts.label}] All ${maxAttempts} attempts failed`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
