import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Hexagonal Architecture Rules', () => {
  const getFilesInFolder = (folderPath: string): string[] => {
    const fullPath = join(__dirname, '../../src', folderPath);
    const files: string[] = [];

    const scan = (dir: string) => {
      const items = readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          scan(join(dir, item.name));
        } else if (item.name.endsWith('.ts')) {
          files.push(join(dir, item.name));
        }
      }
    };

    scan(fullPath);
    return files;
  };

  const getImportsFromFile = (filePath: string): string[] => {
    const content = readFileSync(filePath, 'utf-8');
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.push(match[1]);
      }
    }

    return imports;
  };

  const checkNoImportsFromLayer = (sourceFolder: string, forbiddenLayer: string) => {
    const files = getFilesInFolder(sourceFolder);
    const violations: string[] = [];

    for (const file of files) {
      const imports = getImportsFromFile(file);
      for (const importPath of imports) {
        if (
          importPath.includes(`/${forbiddenLayer}/`) ||
          importPath.startsWith(`../${forbiddenLayer}/`)
        ) {
          violations.push(`${file} imports from ${forbiddenLayer}: ${importPath}`);
        }
      }
    }

    return violations;
  };

  describe('Domain Layer Independence', () => {
    it('should not import from application layer', () => {
      const violations = checkNoImportsFromLayer('domain', 'application');
      expect(violations).toEqual([]);
    });

    it('should not import from infrastructure layer', () => {
      const violations = checkNoImportsFromLayer('domain', 'infrastructure');
      expect(violations).toEqual([]);
    });

    it('should not import from interfaces layer', () => {
      const violations = checkNoImportsFromLayer('domain', 'interfaces');
      expect(violations).toEqual([]);
    });

    it('should not import from config layer', () => {
      const violations = checkNoImportsFromLayer('domain', 'config');
      expect(violations).toEqual([]);
    });
  });

  describe('Application Layer Dependencies', () => {
    it('should not import from infrastructure layer', () => {
      const violations = checkNoImportsFromLayer('application', 'infrastructure');
      expect(violations).toEqual([]);
    });

    it('should not import from interfaces layer', () => {
      const violations = checkNoImportsFromLayer('application', 'interfaces');
      expect(violations).toEqual([]);
    });
  });

  describe('Infrastructure Layer Dependencies', () => {
    it('should not import from interfaces layer', () => {
      const violations = checkNoImportsFromLayer('infrastructure', 'interfaces');
      expect(violations).toEqual([]);
    });
  });

  describe('Interfaces Layer Dependencies', () => {
    it('should not import from domain layer directly', () => {
      const violations = checkNoImportsFromLayer('interfaces', 'domain');
      expect(violations).toEqual([]);
    });

    it('should not import from infrastructure layer', () => {
      const violations = checkNoImportsFromLayer('interfaces', 'infrastructure');
      expect(violations).toEqual([]);
    });
  });

  describe('Layer-Specific Rules', () => {
    describe('DTOs', () => {
      it('should not import domain models directly', () => {
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
    });

    describe('Use Cases', () => {
      it('should not import from infrastructure', () => {
        const useCaseFiles = getFilesInFolder('application').filter(file =>
          file.includes('use-case')
        );
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

    describe('Controllers', () => {
      it('should import from application use cases', () => {
        const controllerFiles = getFilesInFolder('interfaces').filter(file =>
          file.includes('controller')
        );
        const violations: string[] = [];

        for (const file of controllerFiles) {
          const imports = getImportsFromFile(file);
          const hasApplicationImport = imports.some(importPath =>
            importPath.includes('/application/')
          );

          if (!hasApplicationImport) {
            violations.push(`${file} should import from application layer`);
          }
        }

        expect(violations).toEqual([]);
      });
    });

    describe('Security Module', () => {
      it('should follow architectural boundaries', () => {
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
  });

  describe('Circular Dependencies', () => {
    it('should not have circular dependencies between modules', () => {
      const allFiles = [
        ...getFilesInFolder('domain'),
        ...getFilesInFolder('application'),
        ...getFilesInFolder('infrastructure'),
        ...getFilesInFolder('interfaces'),
        ...getFilesInFolder('config'),
      ];

      const dependencyGraph = new Map<string, Set<string>>();

      for (const file of allFiles) {
        const imports = getImportsFromFile(file);
        const relativeImports = imports.filter(
          imp => imp.startsWith('./') || imp.startsWith('../')
        );
        dependencyGraph.set(file, new Set(relativeImports));
      }

      const violations: string[] = [];
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const hasCycle = (file: string): boolean => {
        if (recursionStack.has(file)) {
          violations.push(`Circular dependency detected involving: ${file}`);
          return true;
        }
        if (visited.has(file)) {
          return false;
        }

        visited.add(file);
        recursionStack.add(file);

        const dependencies = dependencyGraph.get(file) || new Set();
        for (const dep of dependencies) {
          if (hasCycle(dep)) {
            return true;
          }
        }

        recursionStack.delete(file);
        return false;
      };

      for (const file of allFiles) {
        if (!visited.has(file)) {
          hasCycle(file);
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Shared Module Independence', () => {
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
});
