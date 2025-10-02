// Secure logging utility for Edge Functions
// Only logs in development to prevent sensitive information exposure in production

const isProduction = Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined;

export const logger = {
  error: (...args: any[]) => {
    if (!isProduction) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  }
};
