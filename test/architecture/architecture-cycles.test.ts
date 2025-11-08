import { getFilesInFolder, getImportsFromFile } from './helpers';

type CycleDetectionContext = {
  graph: Map<string, Set<string>>;
  visited: Set<string>;
  stack: Set<string>;
  violations: string[];
};

const buildDependencyGraph = (files: string[]): Map<string, Set<string>> => {
  const graph = new Map<string, Set<string>>();

  for (const file of files) {
    const imports = getImportsFromFile(file);
    const relativeImports = imports.filter(imp => imp.startsWith('./') || imp.startsWith('../'));
    graph.set(file, new Set(relativeImports));
  }

  return graph;
};

const isInStack = (file: string, ctx: CycleDetectionContext): boolean => {
  if (ctx.stack.has(file)) {
    ctx.violations.push(`Circular dependency detected involving: ${file}`);
    return true;
  }
  return false;
};

const checkDependencies = (file: string, ctx: CycleDetectionContext): boolean => {
  const dependencies = ctx.graph.get(file) || new Set();
  for (const dep of dependencies) {
    if (checkSingleFileForCycle(dep, ctx)) return true;
  }
  return false;
};

const checkSingleFileForCycle = (file: string, ctx: CycleDetectionContext): boolean => {
  if (isInStack(file, ctx)) return true;
  if (ctx.visited.has(file)) return false;

  ctx.visited.add(file);
  ctx.stack.add(file);
  const hasCycle = checkDependencies(file, ctx);
  ctx.stack.delete(file);

  return hasCycle;
};

const detectCycles = (files: string[]): string[] => {
  const ctx: CycleDetectionContext = {
    graph: buildDependencyGraph(files),
    violations: [],
    visited: new Set<string>(),
    stack: new Set<string>(),
  };

  for (const file of files) {
    if (!ctx.visited.has(file)) {
      checkSingleFileForCycle(file, ctx);
    }
  }

  return ctx.violations;
};

describe('Architecture - Circular Dependencies', () => {
  it('should not have circular dependencies between modules', () => {
    const allFiles = [
      ...getFilesInFolder('domain'),
      ...getFilesInFolder('application'),
      ...getFilesInFolder('infrastructure'),
      ...getFilesInFolder('interfaces'),
      ...getFilesInFolder('config'),
    ];

    const violations = detectCycles(allFiles);
    expect(violations).toEqual([]);
  });
});
