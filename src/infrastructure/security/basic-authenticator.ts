export interface AuthenticationCredentials {
  readonly username: string;
  readonly password: string;
}

export interface Authenticator {
  authenticate(credentials: AuthenticationCredentials): Promise<boolean>;
}

export class BasicAuthenticator implements Authenticator {
  private readonly validCredentials: Map<string, string>;

  constructor(credentials: Record<string, string> = {}) {
    this.validCredentials = new Map();

    const defaultCredentials = {
      admin: 'password',
      user: 'secret',
      ...credentials,
    };

    Object.entries(defaultCredentials).forEach(([username, password]) => {
      this.validCredentials.set(username, password);
    });
  }

  async authenticate(credentials: AuthenticationCredentials): Promise<boolean> {
    const storedPassword = this.validCredentials.get(credentials.username);
    return storedPassword === credentials.password;
  }
}
