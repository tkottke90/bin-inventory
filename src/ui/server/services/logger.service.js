const path = require('path');
const { createLogger, format, transports } = require('winston');

const env = require('./environment.service');

class Logger {
  MEGABYTE = 1000000;
  logger;

  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.simple(),
        format.printf((info) => {
          const message = info.message;
          delete info.message;

          return `${info.timestamp} | ${info.level} | ${message} ${JSON.stringify(info)}`;
        })
      ),
      transports: [
        new transports.Console({ level: env.NODE_ENV === 'development' ? 'debug' : 'info'}),
        new transports.File({
          filename: path.join(env.CWD, 'logs', 'server.log'),
          level: env.NODE_ENV === 'development' ? 'debug' : 'info',
          maxsize: Logger.MEGABYTE
        })
      ]
    });
  }

  log(level, message, data = '') {
    const allowedLevels = ['debug' , 'info' , 'verbose' , 'http' , 'warn' , 'error']
    let _inputLevel = level;
    if (!allowedLevels.includes(level)){
      _inputLevel = 'debug';
    }

    this.logger.log(_inputLevel, message, data);
  }

  error(err, customMessageFn = (message) => message ) {
    this.logger.log(
      'error',
      customMessageFn(err.message),
      { ...err }
    );
  }

  logMethod = (level) => (message, data) => {
    this.log(level, message, data);
  }
}

module.exports = new Logger();
