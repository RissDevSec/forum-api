import express from 'express';
import users from '../../Interfaces/http/api/users/index.js';
import authentications from '../../Interfaces/http/api/authentications/index.js';
import { errorMiddleware } from '../../Interfaces/http/middleware/errorMiddleware.js';
import threads from '../../Interfaces/http/api/threads/index.js';
import comments from '../../Interfaces/http/api/comments/index.js';
import replies from '../../Interfaces/http/api/replies/index.js';
import { notFoundMiddleware } from '../../Interfaces/http/middleware/notFoundMiddlewate.js';
import commentLikes from '../../Interfaces/http/api/commentLikes/index.js';

const createServer = async (container) => {
  const app = express();

  // Middleware for parsing JSON
  app.use(express.json());

  app.use((req, res, next) => {
    req.body ??= {};
    next();
  });

  // Register routes
  app.use('/users', users(container));
  app.use('/authentications', authentications(container));

  // Api
  app.use('/threads', threads(container));
  app.use('/threads/:threadId/comments', comments(container)),
  app.use('/threads/:threadId/comments/:commentId/likes', commentLikes(container)),
  app.use('/threads/:threadId/comments/:commentId/replies', replies(container)),

  // 404 handler
  app.use(notFoundMiddleware);

  // Middleware for error
  app.use(errorMiddleware);

  return app;
};

export default createServer;
