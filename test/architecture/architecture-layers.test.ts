import { checkNoImportsFromLayer } from './helpers';

describe('Architecture - Layer Independence', () => {
  it('Domain Layer - should not import from application layer', () => {
    const violations = checkNoImportsFromLayer('domain', 'application');
    expect(violations).toEqual([]);
  });

  it('Domain Layer - should not import from infrastructure layer', () => {
    const violations = checkNoImportsFromLayer('domain', 'infrastructure');
    expect(violations).toEqual([]);
  });

  it('Domain Layer - should not import from interfaces layer', () => {
    const violations = checkNoImportsFromLayer('domain', 'interfaces');
    expect(violations).toEqual([]);
  });

  it('Domain Layer - should not import from config layer', () => {
    const violations = checkNoImportsFromLayer('domain', 'config');
    expect(violations).toEqual([]);
  });

  it('Application Layer - should not import from infrastructure layer', () => {
    const violations = checkNoImportsFromLayer('application', 'infrastructure');
    expect(violations).toEqual([]);
  });

  it('Application Layer - should not import from interfaces layer', () => {
    const violations = checkNoImportsFromLayer('application', 'interfaces');
    expect(violations).toEqual([]);
  });

  it('Infrastructure Layer - should not import from interfaces layer', () => {
    const violations = checkNoImportsFromLayer('infrastructure', 'interfaces');
    expect(violations).toEqual([]);
  });

  it('Interfaces Layer - should not import from domain layer directly', () => {
    const violations = checkNoImportsFromLayer('interfaces', 'domain');
    expect(violations).toEqual([]);
  });

  it('Interfaces Layer - should not import from infrastructure layer', () => {
    const violations = checkNoImportsFromLayer('interfaces', 'infrastructure');
    expect(violations).toEqual([]);
  });
});
