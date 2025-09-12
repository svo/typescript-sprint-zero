import 'reflect-metadata';

const originalError = console.error;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const errorMessage = args.join(' ');

    if (errorMessage.includes('Test error') || errorMessage.includes('Middleware error')) {
      return;
    }

    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
