import { RouteDefinition } from '../adapters/server.adapter';
import { AbstractUserController } from '../controllers/abstract-user.controller';

export const createUserRoutes = (userController: AbstractUserController): RouteDefinition[] => {
  return [
    {
      method: 'POST',
      path: '/users',
      handler: userController.createUser,
    },
    {
      method: 'GET',
      path: '/users/:id',
      handler: userController.getUser,
    },
  ];
};
