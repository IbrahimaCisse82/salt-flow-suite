// Secure logging utility that only logs in development mode
// Prevents sensitive information from being exposed in production console logs

const isDevelopment = import.meta.env.DEV;

export const logger = {
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  }
};
