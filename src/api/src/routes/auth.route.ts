import BaseRoute from '../classes/base-route.class';
import Application from '../classes/application.class';

import { IHooksArray, IContext } from '../interfaces/routing.interfaces';

export default class UsersRoute extends BaseRoute {

  private beforeHooks: IHooksArray = {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    updateOrCreate: [],
    delete: []
  };

  private afterHooks: IHooksArray = {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    updateOrCreate: [],
    delete: []
  };

  private errorHooks: IHooksArray = {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    updateOrCreate: [],
    delete: []
  };

  constructor(app: Application) {
    super(app, '/auth');

    this.setup({
      routes: [
        { method: 'post', path: '/login', action: app.authentication.basicAuth },
        { method: 'get', path: '/get-user', action: this.getIDToken, beforeHooks: [ app.authentication.jwtAuth ] }
      ]
    });
  }

  private getIDToken = (context: IContext) => {
    return new Promise(async (resolve, reject) => {      
      resolve({
        id: await context.app.authentication.createTokenFromObject(context.user)
      });
    });
  }

}

exports.initialize = (app: Application) => {
  return new UsersRoute(app);
}