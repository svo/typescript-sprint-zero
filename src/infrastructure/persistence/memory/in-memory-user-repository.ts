import { User, UserId } from '../../../domain/model/user';
import {
  UserCommandRepository,
  UserQueryRepository,
} from '../../../domain/repository/user-repository';

export class InMemoryUserRepository implements UserQueryRepository, UserCommandRepository {
  private readonly users = new Map<string, User>();

  async create(user: User): Promise<UserId> {
    if (this.users.has(user.id.value)) {
      throw new Error(`User with ID ${user.id.value} already exists`);
    }

    const existingUserByEmail = Array.from(this.users.values()).find(
      existingUser => existingUser.email === user.email
    );

    if (existingUserByEmail) {
      throw new Error(`User with email ${user.email} already exists`);
    }

    this.users.set(user.id.value, user);
    return user.id;
  }

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id.value) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(user => user.email === email.toLowerCase());
    return user || null;
  }

  async exists(id: UserId): Promise<boolean> {
    return this.users.has(id.value);
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async update(user: User): Promise<void> {
    if (!this.users.has(user.id.value)) {
      throw new Error(`User with ID ${user.id.value} not found`);
    }
    this.users.set(user.id.value, user);
  }

  async delete(id: UserId): Promise<void> {
    if (!this.users.has(id.value)) {
      throw new Error(`User with ID ${id.value} not found`);
    }
    this.users.delete(id.value);
  }
}
