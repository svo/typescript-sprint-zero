import { UserId, createUser, createUserId } from '../../domain/model/user';
import {
  UserCommandRepository,
  UserQueryRepository,
} from '../../domain/repository/user-repository';

export interface CreateUserRequest {
  readonly email: string;
  readonly name: string;
  readonly id?: string;
}

export interface CreateUserResponse {
  readonly userId: UserId;
}

export class CreateUserUseCase {
  constructor(
    private readonly commandRepository: UserCommandRepository,
    private readonly queryRepository: UserQueryRepository
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    const userId = request.id ? createUserId(request.id) : createUserId(this.generateId());

    const existingUser = await this.queryRepository.findById(userId);
    if (existingUser) {
      throw new Error(`User with ID ${userId.value} already exists`);
    }

    const existingUserByEmail = await this.queryRepository.findByEmail(request.email);
    if (existingUserByEmail) {
      throw new Error(`User with email ${request.email} already exists`);
    }

    const user = createUser(userId, request.email, request.name);
    const createdUserId = await this.commandRepository.create(user);

    return { userId: createdUserId };
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
