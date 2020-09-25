const path = require('path');
const { createLogger, format, transports } = require('winston');

const env = require('../services/environment.service');

// Configurable list of levels
//    Fatal   - App Crash
//    Error   - Kept user from moving forward
//    Warn    - Depreciated user experience
//    Check   - User noticable event but unimpactful
//    Info    - Details about  user path and details that dont fit in other categories but belong in prod
//    Verbose - Details about exact user actions
//    Debug   - Details for debugging UX
//    Silly   - All items that dont fit in other categories and dont belong in prod 
const customList = [ 'fatal', 'error', 'warn', 'check', 'info', 'verbose', 'debug', 'silly' ];
// Convert the list to an object for winston.  See the level configuration in the documentation https://github.com/winstonjs/winston#logging-levels.
const customLogLevels = customList.reduce( (acc, cur, index) => Object.assign(acc, { [cur]: index }), {});
let MEGABYTE = 1000000;

module.exports = (app) => {

  const level = customList.includes(env.LOG_LEVEL) ? env.LOG_LEVEL : 'info';

  const logger = createLogger({
    levels: customLogLevels,
    level,
    format: format.json(),
    transports: [
      new transports.Console({ level: env.NODE_ENV === 'development' ? 'debug' : 'info'}),
      new transports.File({
        filename: path.join(env.CWD, 'logs', 'analytics.log'),
        level: env.NODE_ENV === 'development' ? 'debug' : 'info',
        maxsize: MEGABYTE
      })
    ]
  });

  app.post('/analytics', (req, res) => {
    let { level, message, meta } = req.body;
    
    level = customList.includes(level) ? level : 'info';
    message = message ? message : '';
    meta = meta ? meta : {};

    try {
      logger.log(level, message, meta);
    } catch {
      res.status(500).send({ status: 'error' });
    }

    res.status(200).send({ status: 'updated' });
  });

};
