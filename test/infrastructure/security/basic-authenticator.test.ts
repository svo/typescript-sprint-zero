import { BasicAuthenticator } from '../../../src/infrastructure/security/basic-authenticator';

describe('BasicAuthenticator', () => {
  describe('with default credentials', () => {
    let authenticator: BasicAuthenticator;

    beforeEach(() => {
      authenticator = new BasicAuthenticator();
    });

    it('should authenticate with valid default credentials', async () => {
      const result = await authenticator.authenticate({
        username: 'admin',
        password: 'password',
      });

      expect(result).toBe(true);
    });

    it('should authenticate with other valid default credentials', async () => {
      const result = await authenticator.authenticate({
        username: 'user',
        password: 'secret',
      });

      expect(result).toBe(true);
    });

    it('should reject invalid username', async () => {
      const result = await authenticator.authenticate({
        username: 'invalid',
        password: 'password',
      });

      expect(result).toBe(false);
    });

    it('should reject invalid password', async () => {
      const result = await authenticator.authenticate({
        username: 'admin',
        password: 'wrong',
      });

      expect(result).toBe(false);
    });
  });

  describe('with custom credentials', () => {
    let authenticator: BasicAuthenticator;

    beforeEach(() => {
      authenticator = new BasicAuthenticator({
        'custom-user': 'custom-pass',
        'another-user': 'another-pass',
      });
    });

    it('should authenticate with custom credentials', async () => {
      const result = await authenticator.authenticate({
        username: 'custom-user',
        password: 'custom-pass',
      });

      expect(result).toBe(true);
    });

    it('should still have default credentials', async () => {
      const result = await authenticator.authenticate({
        username: 'admin',
        password: 'password',
      });

      expect(result).toBe(true);
    });

    it('should override default credentials with custom ones', async () => {
      const customAuthenticator = new BasicAuthenticator({
        admin: 'new-password',
      });

      const resultOldPassword = await customAuthenticator.authenticate({
        username: 'admin',
        password: 'password',
      });

      const resultNewPassword = await customAuthenticator.authenticate({
        username: 'admin',
        password: 'new-password',
      });

      expect(resultOldPassword).toBe(false);
      expect(resultNewPassword).toBe(true);
    });
  });
});
