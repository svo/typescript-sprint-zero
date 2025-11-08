import { getFilesInFolder, getImportsFromFile } from './helpers';

describe('Architecture - DTOs and Use Cases', () => {
  it('DTOs - should not import domain models directly', () => {
    const dtoFiles = getFilesInFolder('interfaces').filter(file => file.includes('dto'));
    const violations: string[] = [];

    for (const file of dtoFiles) {
      const imports = getImportsFromFile(file);
      for (const importPath of imports) {
        if (importPath.includes('/domain/model/')) {
          violations.push(`${file} imports domain model: ${importPath}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('Use Cases - should not import from infrastructure', () => {
    const useCaseFiles = getFilesInFolder('application').filter(file => file.includes('use-case'));
    const violations: string[] = [];

    for (const file of useCaseFiles) {
      const imports = getImportsFromFile(file);
      for (const importPath of imports) {
        if (importPath.includes('/infrastructure/')) {
          violations.push(`${file} imports from infrastructure: ${importPath}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
