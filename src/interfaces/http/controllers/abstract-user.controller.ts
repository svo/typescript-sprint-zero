import { CreateUserUseCase } from '../../../application/use-case/create-user.use-case';
import { GetUserUseCase } from '../../../application/use-case/get-user.use-case';
import { HttpRequest, HttpResponse } from '../adapters/server.adapter';
import {
  CreateUserRequestDto,
  createUserResponseDto,
  getUserResponseDto,
  createErrorResponseDto,
} from '../dto/user.dto';

export class AbstractUserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase
  ) {}

  /**
   * @swagger
   * /api/users:
   *   post:
   *     summary: Create a new user
   *     tags: [Users]
   *     security:
   *       - basicAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 location:
   *                   type: string
   *       400:
   *         description: Invalid request data
   *       409:
   *         description: User already exists
   *       500:
   *         description: Internal server error
   */
  createUser = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    try {
      const requestDto: CreateUserRequestDto = req.body as CreateUserRequestDto;

      if (!requestDto.email || !requestDto.name) {
        res
          .status(400)
          .json(createErrorResponseDto('ValidationError', 'Email and name are required'));
        return;
      }

      const result = await this.createUserUseCase.execute(requestDto);
      const responseDto = createUserResponseDto(result.userId.value);

      res.status(201).header('Location', responseDto.location).json(responseDto);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json(createErrorResponseDto('ConflictError', error.message));
          return;
        }

        if (error.message.includes('Invalid') || error.message.includes('cannot be empty')) {
          res.status(400).json(createErrorResponseDto('ValidationError', error.message));
          return;
        }
      }

      res
        .status(500)
        .json(createErrorResponseDto('InternalServerError', 'An unexpected error occurred'));
    }
  };

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Get a user by ID
   *     tags: [Users]
   *     security:
   *       - basicAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: User ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 name:
   *                   type: string
   *                 email:
   *                   type: string
   *       400:
   *         description: Invalid request data
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  getUser = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    try {
      const userId = req.params['id'];

      if (!userId) {
        res.status(400).json(createErrorResponseDto('ValidationError', 'User ID is required'));
        return;
      }

      const result = await this.getUserUseCase.execute({ userId });
      const responseDto = getUserResponseDto(result.user);

      res.status(200).json(responseDto);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json(createErrorResponseDto('NotFoundError', error.message));
          return;
        }

        if (error.message.includes('cannot be empty')) {
          res.status(400).json(createErrorResponseDto('ValidationError', error.message));
          return;
        }
      }

      res
        .status(500)
        .json(createErrorResponseDto('InternalServerError', 'An unexpected error occurred'));
    }
  };
}
