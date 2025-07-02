const swaggerJSDoc = require('swagger-jsdoc');
const { version } = require('../package.json');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TypeScript Sprint Zero API',
      version: version,
      description: 'Minimal, opinionated scaffolding for TypeScript backend services',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
        },
      },
    },
  },
  apis: ['./src/interfaces/http/controllers/*.ts', './src/interfaces/http/abstract-server.ts'],
};

const specs = swaggerJSDoc(options);

module.exports = specs;
