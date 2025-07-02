import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

export const createUserRoutes = (userController: UserController): Router => {
  const router = Router();

  router.post('/users', userController.createUser);
  router.get('/users/:id', userController.getUser);

  return router;
};
