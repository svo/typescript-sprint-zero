import { User, UserId } from '../model/user';

export interface UserRepository {
  create(user: User): Promise<UserId>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  exists(id: UserId): Promise<boolean>;
}

export interface UserQueryRepository extends UserRepository {
  findAll(): Promise<User[]>;
}

export interface UserCommandRepository {
  create(user: User): Promise<UserId>;
  update(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}
