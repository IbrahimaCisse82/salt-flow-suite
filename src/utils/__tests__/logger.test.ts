import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
  let consoleInfoSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });


  it('should log info messages', () => {
    logger.info('Test info', { data: 'test' });
    expect(consoleInfoSpy).toHaveBeenCalled();
  });

  it('should log warning messages', () => {
    logger.warn('Test warning', { data: 'test' });
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should log error messages', () => {
    logger.error('Test error', new Error('test'), { data: 'test' });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should log messages with metadata', () => {
    logger.info('Test with metadata', { userId: '123', action: 'test' });
    expect(consoleInfoSpy).toHaveBeenCalled();
  });
});
