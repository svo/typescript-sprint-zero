export interface Environment {
  readonly nodeEnv: string;
  readonly port: number;
  readonly host: string;
  readonly logLevel: string;
}

export const getEnvironment = (): Environment => {
  return {
    nodeEnv: process.env['NODE_ENV'] || 'development',
    port: parseInt(process.env['PORT'] || '3000', 10),
    host: process.env['HOST'] || '0.0.0.0',
    logLevel: process.env['LOG_LEVEL'] || 'info',
  };
};

export const isDevelopment = (): boolean => {
  return getEnvironment().nodeEnv === 'development';
};

export const isProduction = (): boolean => {
  return getEnvironment().nodeEnv === 'production';
};

export const isTest = (): boolean => {
  return getEnvironment().nodeEnv === 'test';
};
