import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../../application/use-case/create-user.use-case';
import { GetUserUseCase } from '../../../application/use-case/get-user.use-case';
import {
  CreateUserRequestDto,
  createUserResponseDto,
  getUserResponseDto,
  createErrorResponseDto,
} from '../dto/user.dto';

export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase
  ) {}

  private validateCreateUserRequest(requestDto: CreateUserRequestDto, res: Response): boolean {
    if (!requestDto.email || !requestDto.name) {
      res
        .status(400)
        .json(createErrorResponseDto('ValidationError', 'Email and name are required'));
      return false;
    }
    return true;
  }

  private handleCreateUserError(error: unknown, res: Response): void {
    if (!(error instanceof Error)) {
      res
        .status(500)
        .json(createErrorResponseDto('InternalServerError', 'An unexpected error occurred'));
      return;
    }

    if (error.message.includes('already exists')) {
      res.status(409).json(createErrorResponseDto('ConflictError', error.message));
    } else if (error.message.includes('Invalid') || error.message.includes('cannot be empty')) {
      res.status(400).json(createErrorResponseDto('ValidationError', error.message));
    } else {
      res
        .status(500)
        .json(createErrorResponseDto('InternalServerError', 'An unexpected error occurred'));
    }
  }

  private validateGetUserRequest(userId: string | undefined, res: Response): userId is string {
    if (!userId) {
      res.status(400).json(createErrorResponseDto('ValidationError', 'User ID is required'));
      return false;
    }
    return true;
  }

  private handleGetUserError(error: unknown, res: Response): void {
    if (!(error instanceof Error)) {
      res
        .status(500)
        .json(createErrorResponseDto('InternalServerError', 'An unexpected error occurred'));
      return;
    }

    if (error.message.includes('not found')) {
      res.status(404).json(createErrorResponseDto('NotFoundError', error.message));
    } else if (error.message.includes('cannot be empty')) {
      res.status(400).json(createErrorResponseDto('ValidationError', error.message));
    } else {
      res
        .status(500)
        .json(createErrorResponseDto('InternalServerError', 'An unexpected error occurred'));
    }
  }

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestDto: CreateUserRequestDto = req.body;
      if (!this.validateCreateUserRequest(requestDto, res)) return;

      const result = await this.createUserUseCase.execute(requestDto);
      const responseDto = createUserResponseDto(result.userId.value);
      res.status(201).header('Location', responseDto.location).json(responseDto);
    } catch (error) {
      this.handleCreateUserError(error, res);
    }
  };

  getUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params['id'];
      if (!this.validateGetUserRequest(userId, res)) return;

      const result = await this.getUserUseCase.execute({ userId });
      const responseDto = getUserResponseDto(result.user);
      res.status(200).json(responseDto);
    } catch (error) {
      this.handleGetUserError(error, res);
    }
  };
}
