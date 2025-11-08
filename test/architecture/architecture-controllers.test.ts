import { getFilesInFolder, getImportsFromFile } from './helpers';

describe('Architecture - Controllers and Security', () => {
  it('Controllers - should import from application use cases', () => {
    const controllerFiles = getFilesInFolder('interfaces').filter(file =>
      file.includes('controller')
    );
    const violations: string[] = [];

    for (const file of controllerFiles) {
      const imports = getImportsFromFile(file);
      const hasApplicationImport = imports.some(importPath => importPath.includes('/application/'));

      if (!hasApplicationImport) {
        violations.push(`${file} should import from application layer`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('Security Module - should follow architectural boundaries', () => {
    const securityFiles = getFilesInFolder('infrastructure').filter(file =>
      file.includes('security')
    );
    const violations: string[] = [];

    for (const file of securityFiles) {
      const imports = getImportsFromFile(file);
      for (const importPath of imports) {
        if (importPath.includes('/interfaces/')) {
          violations.push(`${file} should not import from interfaces: ${importPath}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
