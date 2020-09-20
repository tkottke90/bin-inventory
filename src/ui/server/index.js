const express = require('express');
const helmet = require('helmet');

const { createHttpTerminator } = require('http-terminator');

const Environment = require('./services/environment.service');
const Logger = require('./services/logger.service');

// Init Express
const app = express();
app.use(helmet());

// Init modules
app.env = Environment;
app.logger = Logger;

// Add HTTP Logging
app.use(function (req, res, next) {
  app.logger.log('http', `${req.method} ${req.originalUrl}`);
  next();
});

// Init Routes
require('./routes/index')(app);

// Init Server
const server = app.listen(app.env.PORT, () => {
  app.logger.log('info', `Proxy started on port ${app.env.PORT}`)
});

const httpTerminator = createHttpTerminator({ server });

process.on('SIGTERM', () => {
  app.logger.log('info', 'SIGTERM Received - Shutting Down')
  httpTerminator.terminate();
});

process.on('SIGINT', () => {
  app.logger.log('info', 'SIGINT Received - Shutting Down')
  httpTerminator.terminate();
});