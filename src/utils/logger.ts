// Secure logging utility that sanitizes errors in production
// Prevents sensitive information from being exposed in production console logs

const isDevelopment = import.meta.env.DEV;

/**
 * Sanitize error objects for production logging
 * Removes sensitive fields and stack traces
 */
const sanitizeError = (error: any): string => {
  if (!error) return 'Unknown error';
  
  // If it's an Error object, just return the message
  if (error instanceof Error) {
    return error.message;
  }
  
  // If it's a Supabase error with a message
  if (error.message) {
    return error.message;
  }
  
  // If it's a string, return it
  if (typeof error === 'string') {
    return error;
  }
  
  // Otherwise, return generic error
  return 'An error occurred';
};

export const logger = {
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, only log sanitized error messages
      const sanitized = args.map(arg => 
        typeof arg === 'object' ? sanitizeError(arg) : arg
      );
      console.error(...sanitized);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    } else {
      // In production, sanitize warnings too
      const sanitized = args.map(arg => 
        typeof arg === 'object' ? sanitizeError(arg) : arg
      );
      console.warn(...sanitized);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
    // In production, no info logs
  },
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
    // In production, no debug logs
  }
};
