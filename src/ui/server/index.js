const fs = require('fs');
const path = require('path')
const https = require('https');
const privateKey = fs.readFileSync(path.resolve(__dirname, '../../../certs/domain.key'));
const cert = fs.readFileSync(path.resolve(__dirname, '../../../certs/domain.crt'));
const express = require('express');
const helmet = require('helmet');

const { createHttpTerminator } = require('http-terminator');

const Environment = require('./services/environment.service');
const Logger = require('./services/logger.service');

// Init Express
const app = express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: [ "'self'" ],
      fontSrc: [ "'self'", 'https:', 'data:' ],
      scriptSrc: [ "'self'", 'https://unpkg.com' ],
      styleSrc: [ "'self'", 'https:', "'unsafe-inline'", "'unsafe-inline'" ],
      'style-src-elem': [ "'self'", 'https:', "'unsafe-inline'" ],
      imgSrc: [ "'self'", 'blob:', 'data:', 'https:' ],
      upgradeInsecureRequests: []
    }
  }
}));

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
  app.logger.log('info', `Proxy started  ${app.env.HOST}:${app.env.PORT}`)
});

// const server = https.createServer({
//   key: privateKey,
//   cert: cert
// }, app).listen(app.env.PORT, app.env.HOST);

const httpTerminator = createHttpTerminator({ server });

process.on('SIGTERM', () => {
  app.logger.log('info', 'SIGTERM Received - Shutting Down')
  httpTerminator.terminate();
});

process.on('SIGINT', () => {
  app.logger.log('info', 'SIGINT Received - Shutting Down')
  httpTerminator.terminate();
});