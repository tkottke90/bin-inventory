import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import bcrypt from 'bcrypt';

import environment from '../services/environment.service';
import logger from '../services/logger.service';

export default function sequelizeService() {
  let sequelize;

  const modelFileExtension = environment.IS_DEVELOPMENT ? 'ts' : 'js';

  const options: SequelizeOptions = {
    database: environment.DATABASE_NAME,
    username: environment.DATABASE_USER,
    password: environment.DATABASE_PASSWORD,
    host: environment.DATABASE_HOST,
    port: environment.DATABASE_PORT,
    dialect: 'postgres',
    logging: (...msg: any[]) => logger.log('verbose', 'sequelize', msg),
    models: [`${__dirname}/**/*.model.${modelFileExtension}`],
    modelMatch: (filename: string, member: string) => {
      return filename.substring(0, filename.indexOf('.model')) === member.toLowerCase();
    }
  };

  if (!environment.IS_DEVELOPMENT) {
    options.ssl = true;
    options.dialectOptions = { ssl: true };
  }

  sequelize = new Sequelize(options);

  const UserModel = sequelize.model('User');
  UserModel.count().done(async (count: number) => {
    if (count <= 0) {
      logger.log('info', '[startup] User Table Empty - Creating Default User', { username: 'admin.user@tdkottke.com' });
      try {
        UserModel.create({
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin.user@tdkottke.com',
          password: await bcrypt.hash('admin', environment.SALT),
          type: 'admin',
          active: true,
          settings: {}
        });
      } catch (err) {
        logger.error(err, (message) => `Sequelize Error during Setup - Create Default User: ${message}`);
        process.exit(1);
      }
    } else {
      logger.log('info', 'Users detected in table - skipping')
    }
  });
  return sequelize;
}