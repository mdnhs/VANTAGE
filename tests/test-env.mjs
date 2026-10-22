// Single source of truth for the environment tests run under.
export const TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST ?? 'postgresql://vantage:vantage@localhost:5433/vantage_test';

/** @type {NodeJS.ProcessEnv} */
export const TEST_ENV = {
  NODE_ENV: 'test',
  DATABASE_URL: TEST_DATABASE_URL,
  AUTH_SECRET: 'test-secret-0123456789-abcdefghij-klmnop',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  // 32 bytes of 0x07, base64: tests only.
  APP_ENCRYPTION_KEY: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
  MEDIA_DRIVER: 'local',
  MEDIA_LOCAL_DIR: '.test-uploads',
  MEDIA_KEY_PREFIX: 'vantage',
};
