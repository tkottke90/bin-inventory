import DataModelRoute from '../classes/data-model.class';
import Application from '../classes/application.class';

import { IHooksArray } from '../interfaces/routing.interfaces';
import { limitAccess } from '../hooks/limit-access.hook';

class TransactionsRoute extends DataModelRoute {

  private beforeHooks: IHooksArray = {
    all: [ this.app.authentication.jwtAuth ],
    find: [ limitAccess('user') ],
    get: [ limitAccess('user') ],
    create: [ limitAccess('user') ],
    update: [ limitAccess('admin') ],
    updateOrCreate: [ limitAccess('admin') ],
    delete: [ limitAccess('admin') ]
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
    super(app, 'transactions');

    this.configure('Transaction', { before: this.beforeHooks, after: this.afterHooks, error: this.errorHooks });
  }

}

exports.initialize = (app: Application) => {
  return new TransactionsRoute(app);
}