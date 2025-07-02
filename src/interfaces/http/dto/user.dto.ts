export interface CreateUserRequestDto {
  readonly email: string;
  readonly name: string;
  readonly id?: string;
}

export interface CreateUserResponseDto {
  readonly id: string;
  readonly location: string;
}

export interface GetUserResponseDto {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

export interface ErrorResponseDto {
  readonly error: string;
  readonly message: string;
  readonly timestamp: string;
}

export interface UserData {
  readonly id: { value: string };
  readonly email: string;
  readonly name: string;
}

export const createUserResponseDto = (userId: string): CreateUserResponseDto => ({
  id: userId,
  location: `/users/${userId}`,
});

export const getUserResponseDto = (user: UserData): GetUserResponseDto => ({
  id: user.id.value,
  email: user.email,
  name: user.name,
});

export const createErrorResponseDto = (error: string, message: string): ErrorResponseDto => ({
  error,
  message,
  timestamp: new Date().toISOString(),
});
