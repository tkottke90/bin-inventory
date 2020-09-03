import path from 'path';
import { createLogger, format, transports } from 'winston';
import winston from 'winston';

import environment from './environment.service';

// Configurable list of levels
const customList = [ 'fatal', 'error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly' ];
//                                                ^
//                                             default
// Convert the list to an object for winston.  See the level configuration in the documenation https://github.com/winstonjs/winston#logging-levels.
const customLogLevels = customList.reduce( (acc, cur, index) => Object.assign(acc, { [cur]: index }), {});

export class Logger {
  private static MEGABYTE = 1000000;

  private logger: winston.Logger;

  constructor() {
    this.logger = createLogger({
      levels: customLogLevels,
      level: 'info',
      silent: process.env.NODE_ENV === 'testing',
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
        new transports.Console({ level: environment.IS_DEVELOPMENT ? 'debug' : 'info'}),
        new transports.File({
          filename: path.join(environment.CWD, 'logs', 'server.log'),
          level: environment.IS_DEVELOPMENT ? 'verbose' : 'info',
          maxsize: Logger.MEGABYTE
        })
      ]
    });
  }

  public log(level: 'debug' | 'verbose' | 'http' | 'info' | 'warn' | 'error', message: string, data: any = '') {
    this.logger.log(level, message, data);
  }

  public error(err: Error, customMessageFn: (message: string) => string = (message) => message ) {
    this.logger.log(
      'error',
      customMessageFn(err.message),
      { ...err }
    );
  }
}

export default new Logger();
