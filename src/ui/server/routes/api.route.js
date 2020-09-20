const { createProxyMiddleware: proxy } = require('http-proxy-middleware');
const environmentService = require('../services/environment.service');
const Logger = require('../services/logger.service');

module.exports = (app) => {

  const logProvider = (provider) => {
    const logger = {
        log: Logger.logMethod('info'),
        info: Logger.logMethod('info'),
        debug: Logger.logMethod('debug'),
        warn: Logger.logMethod('warn'),
        error: Logger.logMethod('error')
    };

    return logger;
  };

  app.use('/api', proxy({
    target: `${environmentService.SERVER_URL}`,
    changeOrigin: true,
    logLevel: 'debug',
    logProvider,
    pathRewrite: { '^/api' : '' }
  }))
}