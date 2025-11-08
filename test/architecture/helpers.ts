import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export const getFilesInFolder = (folderPath: string): string[] => {
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

export const getImportsFromFile = (filePath: string): string[] => {
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

export const checkNoImportsFromLayer = (sourceFolder: string, forbiddenLayer: string) => {
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
