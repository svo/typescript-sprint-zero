export interface UserId {
  readonly value: string;
}

export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly name: string;
}

export const createUserId = (value: string): UserId => {
  if (!value || value.trim().length === 0) {
    throw new Error('User ID cannot be empty');
  }
  return { value: value.trim() };
};

export const createUser = (id: UserId, email: string, name: string): User => {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }
  if (!name || name.trim().length === 0) {
    throw new Error('Name cannot be empty');
  }

  return {
    id,
    email: email.trim().toLowerCase(),
    name: name.trim(),
  };
};
