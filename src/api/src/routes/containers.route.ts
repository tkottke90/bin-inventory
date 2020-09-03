import DataModelRoute from '../classes/data-model.class';
import Application from '../classes/application.class';

import { IHooksArray } from '../interfaces/routing.interfaces';

class ContainerRoute extends DataModelRoute {

  private beforeHooks: IHooksArray = {
    all: [ this.app.authentication.jwtAuth ],
    find: [ ],
    get: [ ],
    create: [ ],
    update: [ ],
    updateOrCreate: [ ],
    delete: [ ]
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
    super(app, 'containers');

    this.configure('Container', { before: this.beforeHooks, after: this.afterHooks, error: this.errorHooks });
  }

}

exports.initialize = (app: Application) => {
  return new ContainerRoute(app);
}