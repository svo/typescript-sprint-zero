import express from 'express';
import { createAbstractServer } from './abstract-server';
import { ExpressServerAdapter } from './adapters/express-server.adapter';

export const createServer = (): express.Application => {
  const adapter = new ExpressServerAdapter();
  createAbstractServer(adapter);
  return adapter.getFrameworkInstance();
};
