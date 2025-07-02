import { getEnvironment, isDevelopment, isProduction, isTest } from '../../src/config/environment';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getEnvironment', () => {
    it('should return default values when no environment variables are set', () => {
      delete process.env['NODE_ENV'];
      delete process.env['PORT'];
      delete process.env['HOST'];
      delete process.env['LOG_LEVEL'];

      const env = getEnvironment();

      expect(env.nodeEnv).toBe('development');
      expect(env.port).toBe(3000);
      expect(env.host).toBe('0.0.0.0');
      expect(env.logLevel).toBe('info');
    });

    it('should use environment variables when provided', () => {
      process.env['NODE_ENV'] = 'production';
      process.env['PORT'] = '8080';
      process.env['HOST'] = '127.0.0.1';
      process.env['LOG_LEVEL'] = 'debug';

      const env = getEnvironment();

      expect(env.nodeEnv).toBe('production');
      expect(env.port).toBe(8080);
      expect(env.host).toBe('127.0.0.1');
      expect(env.logLevel).toBe('debug');
    });
  });

  describe('isDevelopment', () => {
    it('should return true when NODE_ENV is development', () => {
      process.env['NODE_ENV'] = 'development';
      expect(isDevelopment()).toBe(true);
    });

    it('should return false when NODE_ENV is not development', () => {
      process.env['NODE_ENV'] = 'production';
      expect(isDevelopment()).toBe(false);
    });
  });

  describe('isProduction', () => {
    it('should return true when NODE_ENV is production', () => {
      process.env['NODE_ENV'] = 'production';
      expect(isProduction()).toBe(true);
    });

    it('should return false when NODE_ENV is not production', () => {
      process.env['NODE_ENV'] = 'development';
      expect(isProduction()).toBe(false);
    });
  });

  describe('isTest', () => {
    it('should return true when NODE_ENV is test', () => {
      process.env['NODE_ENV'] = 'test';
      expect(isTest()).toBe(true);
    });

    it('should return false when NODE_ENV is not test', () => {
      process.env['NODE_ENV'] = 'development';
      expect(isTest()).toBe(false);
    });
  });
});
