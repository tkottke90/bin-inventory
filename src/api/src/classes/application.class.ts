import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import logger from '../services/logger.service';
import { Logger } from '../services/logger.service';
import environment from '../services/environment.service';

import { Sequelize } from 'sequelize';
import sequelize from '../models/index';

import AuthenticationService from '../services/authentication.service';
import BaseRoute from './base-route.class';

export default class Application {
  public express: express.Application;
  public port: string;

  public logger: Logger;
  public environment: any;

  public authentication: AuthenticationService;
  public database: Sequelize;

  public services: { [key: string]: BaseRoute }

  constructor() {
    this.express = express();
    this.express.use(express.json());
    this.express.use(helmet());
    this.express.use(cookieParser());

    this.services = {}

    this.logger = logger;
    this.environment = environment;

    this.port = environment.PORT;

    this.database = sequelize();
    this.authentication = new AuthenticationService(this);
  }

  public start() {
    return this.listen(this.port, () => {
      this.logger.log('info', `api server started on port ${this.environment.PORT}, in ${this.environment.ENVIRONMENT} mode`);
    });
  }

  public listen(port: string, callback: () => void) {
    return this.express.listen(port, callback);
  }
}
