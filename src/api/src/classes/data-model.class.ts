import { Request, Response } from 'express';
import BaseRoute from './base-route.class';
import Application from './application.class';

import { IQuery, QueryClass } from './query.class';
import { IContext, IModelHooks } from '@interfaces/routing.interfaces';
import { reject, resolve } from 'bluebird';

interface IConfigurationOptions {
  exclusions?: string[];
}

interface ISequelizeResult {
  dataValues?: any;
  _previousDataValues?: any;
  _changed?: any;
  _options?: any;
  isNewRecord: boolean;
}

const generateResponse = (paginate: boolean, data: any, limit: number, skip: number, total: number) => {
  return paginate ?
    { total, limit, skip, data} :
    [ ...data ] ;
};

export default class DataModelRoute extends BaseRoute {

  public model: any;
  public paginate: boolean;

  // Return value exclusions
  private exclusions: string[];

  constructor(app: Application, routeName: string, options?: IConfigurationOptions) {
    super(app, `/${routeName}`);

    if (options) {
      this.exclusions = options.exclusions ? options.exclusions : [];
    }
  }

  public configure(modelName: string, modelHooks: IModelHooks) {
    if (!this.app.database.models[modelName]) {
      this.app.logger.log('error', `Invalid Model - Please check Sequelize Configuration`);
      console.dir(this.app.database.models);
      process.exit(2);
    }

    this.model = this.app.database.models[modelName];

    const beforeHooks = modelHooks.before;
    const afterHooks = modelHooks.after;
    const errorHooks = modelHooks.error;

    this.setup({
      routes: [
        { method: 'get', path: '/', action: this.get, beforeHooks: [ ...beforeHooks.all, ...beforeHooks.find ], afterHooks: [ ...afterHooks.all, ...afterHooks.find ], errorHooks: [ ...errorHooks.all, ...errorHooks.find ]},
        { method: 'get', path: '/:id', action: this.getById, beforeHooks: [ ...beforeHooks.all, ...beforeHooks.get ], afterHooks: [ ...afterHooks.all, ...afterHooks.get ], errorHooks: [ ...errorHooks.all, ...errorHooks.get ]},
        { method: 'get', path: '/count', action: this.count, beforeHooks: [ ...beforeHooks.all, ...beforeHooks.get ], afterHooks: [ ...afterHooks.all, ...afterHooks.get ], errorHooks: [ ...errorHooks.all, ...errorHooks.get ]},
        { method: 'post', path: '/', action: this.post, beforeHooks: [ ...beforeHooks.all, ...beforeHooks.create ], afterHooks: [ ...afterHooks.all, ...afterHooks.create ], errorHooks: [ ...errorHooks.all, ...errorHooks.create ]},
        { method: 'patch', path: '/:id', action: this.patch, beforeHooks: [ ...beforeHooks.all, ...beforeHooks.update ], afterHooks: [ ...afterHooks.all, ...afterHooks.update ], errorHooks: [ ...errorHooks.all, ...errorHooks.update ]},
        { method: 'put', path: '/:id', action: this.put, beforeHooks: [ ...beforeHooks.all, ...beforeHooks.updateOrCreate ], afterHooks: [ ...afterHooks.all, ...afterHooks.updateOrCreate ], errorHooks: [ ...errorHooks.all, ...errorHooks.updateOrCreate ]},
        { method: 'delete', path: '/:id', action: this.delete, beforeHooks: [ ...beforeHooks.all, ...beforeHooks.delete ], afterHooks: [ ...afterHooks.all, ...afterHooks.delete ], errorHooks: [ ...errorHooks.all, ...errorHooks.delete ]},
      ],
      paginate: true
    });
  }

  // Get record count
  public count = (context: IContext) => {
    return new Promise(async (resolve, reject) => {
      const query: QueryClass = new QueryClass(context.query);
      let result: any;

      const queryObj = query.toSequelizeQuery();
      queryObj.attributes = { exclude: this.exclusions };

      try {
        result = await this.model.count({
          ...queryObj,
          subQuery: false
        });
      } catch (err) {
        this.app.logger.error(err, (message) => `Sequelize Error during update in GET Count Request: ${message}`);
        reject({ _code: 500, message: 'Internal Server Error: Error Getting Users'});
        return;
      }

      resolve(generateResponse(query.paginate, result, query.limit, query.skip, await this.model.count()));
    });
  }

  // Find User
  public get = (context: IContext) => {
    return new Promise( async (resolve, reject) => {
      const query: QueryClass = new QueryClass(context.query);
      let result: any;

      const queryObj = query.toSequelizeQuery();
      queryObj.attributes = { exclude: this.exclusions };

      try {
        result = await this.model.findAll({
          ...queryObj,
          subQuery: false
        });
      } catch (err) {
        this.app.logger.error(err, (message) => `Sequelize Error during update in GET Request: ${message}`);
        reject({ _code: 500, message: 'Internal Server Error: Error Getting Users'});
        return;
      }

      resolve(generateResponse(query.paginate, result, query.limit, query.skip, await this.model.count()));
    });
  }

  // Get User
  public getById = (context: IContext) => {
    return new Promise ( async (resolve, reject) => {
      let result: any;

      // Check if table has primary key
      if (this.model._hasPrimaryKeys) {
        // Generate a new query object
        const query = {} as IQuery;
        // Add the primary key defined in the model and the id sent in via the url
        query[this.model.primaryKeyField] = context.params.id;

        const options: any = { where: query };

        if (!context.params.skipExclusions) {
          options.attributes = { exclude: this.exclusions };
        }

        // Query the Database
        try {
          result = await this.model.findOne(options);
        } catch (err) {
          this.app.logger.error(err, (message) => `Sequelize Error during get in GET by ID Request: ${message}`);
          reject({ _code: 500, message: 'Error in Model Get' });
          return;
        }
      }

      if (!result) {
        reject({ _code: 404, message: 'Nothing Found with that ID' });
        return;
      }

      resolve(result);
    });
  }

  // Create User
  public post = (context: IContext) => {
    return new Promise( async (resolve, reject) => {
      let result: ISequelizeResult;

      // Query the Database
      try {
        result = await this.model.create(context.data);
      } catch (err) {
        this.app.logger.error(err, (message) => `Sequelize Error during POST Request: ${message}`);
        reject({ _code: 500, message: `Error POSTing to ${this.routeName} - please check logs` });
        return;
      }

      resolve({ _code: 201, ...result.dataValues });
    });
  }

  // Update User
  public put = (context: IContext) => {
    return new Promise(async (resolve, reject) => {
      // Generate a new query object
      const query = {} as IQuery;
      // Add the primary key defined in the model and the id sent in via the url
      query[this.model.primaryKeyField] = context.params.id;

      try {
        const result = await this.model.findOne({
          where: query,
          attributes: { exclude: this.exclusions }
        });

        // console.dir(result);
        if (result) {
          const updatedItem = await result.update(context.data, { attributes: { exclude: this.exclusions } });
          resolve(updatedItem);
          return;
        }

        const newItem = await this.model.create(context.data, { attributes: { exclude: this.exclusions } });
        resolve(newItem);

      } catch (err) {
        this.app.logger.error(err, (message) => `Sequelize Error during PUT Request: ${message}`);
        reject({ _code: 500, message: `Error PUTing to ${this.routeName} - please check logs`});
        return;
      }
    });
  }

  public patch = (context: IContext) => {
    return new Promise(async (resolve, reject) => {
      let result: any;

      // Check if table has primary key
      if (this.model._hasPrimaryKeys) {
        // Generate a new query object
        const query = {} as IQuery;
        // Add the primary key defined in the model and the id sent in via the url
        query[this.model.primaryKeyField] = context.params.id;

        // Query the Database
        try {
          result = await this.model.findOne({
            where: query,
            attributes: { exclude: this.exclusions }
          });
        } catch (err) {
          this.app.logger.error(err, (message) => `Sequelize Error during get in PATCH Request: ${message}`);
          reject({ _code: 500, message: `Error PATCHing to ${this.routeName} - please check logs`});
          return;
        }
      }

      if (!result) {
        this.app.logger.log('warn', 'Invalid PATCH request - no record found');
        reject({ _code: 404, message: 'Nothing Found with that ID - please check logs'});
        return;
      }

      try {
        result.update(context.data);
      } catch (err) {
        this.app.logger.error(err, (message) => `Sequelize Error during update in PATCH Request: ${message}`);
        reject({ _code: 500, message: 'Error Updating in PATCH request - please check logs'});
        return;
      }

      // Should only return 1 result
      resolve(result);
    });
  }

  // Delete User
  public delete = (context: IContext) => {
    return new Promise(async (resolve, reject) => {
      let result: any;

      // Check if table has primary key
      if (this.model._hasPrimaryKeys) {
        // Generate a new query object
        const query = {} as IQuery;
        // Add the primary key defined in the model and the id sent in via the url
        query[this.model.primaryKeyField] = context.params.id;

        // Query the Database
        try {
          result = await this.model.findOne({
            where: query
          });
        } catch (err) {
          this.app.logger.error(err, (message) => `Sequelize Error during get in DELETE Request: ${message}`);
          reject({ _code: 500, message: `Error DELETing to ${this.routeName} - please check logs` });
          return;
        }
      }

      if (!result) {
        this.app.logger.log('warn', 'Invalid DELETE request - no record found');
        reject({ _code: 404, message: 'Nothing Found with that ID' });
        return;
      }

      try {
        result.destroy();
      } catch (err) {
        this.app.logger.error(err, (message) => `Sequelize Error during delete in DELETE Request: ${message}`);
        reject({ _code: 500, message: 'Error Updating in DELETE request - please check logs' });
        return;
      }

      // Should only return 1 result
      resolve({ _code: 204, data: {} });
    });
  }

}
