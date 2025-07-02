import 'reflect-metadata';
import { setupContainer } from './config/container';
import { createServer } from './interfaces/http/server';
import { getEnvironment } from './config/environment';

const bootstrap = async (): Promise<void> => {
  try {
    setupContainer();

    const app = createServer();
    const env = getEnvironment();

    const server = app.listen(env.port, env.host, () => {
      console.log(`🚀 Server running at http://${env.host}:${env.port}`);
      console.log(`📦 Environment: ${env.nodeEnv}`);
      console.log(`🔍 Health check: http://${env.host}:${env.port}/api/health`);
    });

    const gracefulShutdown = (signal: string): void => {
      console.log(`\n💤 Received ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

void bootstrap();
