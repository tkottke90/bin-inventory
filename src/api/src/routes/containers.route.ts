import DataModelRoute from '../classes/data-model.class';
import Application from '../classes/application.class';

import { IHooksArray } from '../interfaces/routing.interfaces';
import { limitAccess } from '../hooks/limit-access.hook';

class ContainerRoute extends DataModelRoute {

  private beforeHooks: IHooksArray = {
    all: [ this.app.authentication.jwtAuth ],
    find: [ limitAccess('user') ],
    get: [ limitAccess('user') ],
    create: [ limitAccess('user') ],
    update: [ limitAccess('user') ],
    updateOrCreate: [ limitAccess('user') ],
    delete: [ limitAccess('user') ]
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