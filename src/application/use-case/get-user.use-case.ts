import { User, createUserId } from '../../domain/model/user';
import { UserQueryRepository } from '../../domain/repository/user-repository';

export interface GetUserRequest {
  readonly userId: string;
}

export interface GetUserResponse {
  readonly user: User;
}

export class GetUserUseCase {
  constructor(private readonly queryRepository: UserQueryRepository) {}

  async execute(request: GetUserRequest): Promise<GetUserResponse> {
    const userId = createUserId(request.userId);
    const user = await this.queryRepository.findById(userId);

    if (!user) {
      throw new Error(`User with ID ${userId.value} not found`);
    }

    return { user };
  }
}
