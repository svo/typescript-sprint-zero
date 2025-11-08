import { existsSync } from 'fs';
import { getFilesInFolder, getImportsFromFile } from './helpers';

describe('Architecture - Shared Module', () => {
  it('should not import from application, infrastructure or interfaces', () => {
    const sharedPath = 'src/shared';
    if (!existsSync(sharedPath)) {
      return;
    }
    const sharedFiles = getFilesInFolder('shared');
    const violations: string[] = [];

    for (const file of sharedFiles) {
      const imports = getImportsFromFile(file);
      for (const importPath of imports) {
        if (
          importPath.includes('/application/') ||
          importPath.includes('/infrastructure/') ||
          importPath.includes('/interfaces/')
        ) {
          violations.push(`${file} imports from forbidden layer: ${importPath}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
