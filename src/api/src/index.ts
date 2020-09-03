import Application from './classes/application.class';
import routes from './routes/index';
const { createHttpTerminator } = require('http-terminator');

const app = new Application();

// Setup Routes
routes(app);

const server = app.start();

const httpTerminator = createHttpTerminator({ server });

process.on('SIGTERM', () => {
  app.logger.log('info', 'SIGTERM Received - Shutting Down')
  httpTerminator.terminate();
});

process.on('SIGINT', () => {
  app.logger.log('info', 'SIGINT Received - Shutting Down')
  httpTerminator.terminate();
});

// Export Application for testing
export default app;