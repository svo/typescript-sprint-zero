module.exports = {
  forbidden: [
    {
      name: 'not-to-domain-from-interfaces',
      comment: 'Interfaces layer should not directly import from domain layer',
      severity: 'error',
      from: { path: '^src/interfaces' },
      to: { path: '^src/domain' },
    },
    {
      name: 'not-to-infrastructure-from-application',
      comment: 'Application layer should not import from infrastructure layer',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: '^src/infrastructure' },
    },
    {
      name: 'not-to-interfaces-from-application',
      comment: 'Application layer should not import from interfaces layer',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: '^src/interfaces' },
    },
    {
      name: 'not-to-interfaces-from-domain',
      comment: 'Domain layer should not import from interfaces layer',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/interfaces' },
    },
    {
      name: 'not-to-application-from-domain',
      comment: 'Domain layer should not import from application layer',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/application' },
    },
    {
      name: 'not-to-infrastructure-from-domain',
      comment: 'Domain layer should not import from infrastructure layer',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/infrastructure' },
    },
    {
      name: 'no-circular',
      comment: 'No circular dependencies allowed',
      severity: 'warn',
      from: {},
      to: {
        circular: true,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    includeOnly: {
      path: '^src',
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
    },
  },
};
