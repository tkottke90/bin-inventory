import DataModelRoute from '../classes/data-model.class';
import Application from '../classes/application.class';

import { IHooksArray } from '../interfaces/routing.interfaces';
import { hashPassword } from '../hooks/hash-password.hook';
import { scrubPassword } from '../hooks/scrub-password.hook';
import { uniqueEmail } from '../hooks/unique-email.hook';
import { limitAccess } from '../hooks/limit-access.hook';

class UsersRoute extends DataModelRoute {

  private beforeHooks: IHooksArray = {
    all: [ this.app.authentication.jwtAuth ],
    find: [ limitAccess('admin') ],
    get: [ limitAccess('user', true) ],
    create: [ limitAccess('admin'), uniqueEmail, hashPassword],
    update: [ limitAccess('user', true), uniqueEmail, hashPassword],
    updateOrCreate: [ limitAccess('user', true), uniqueEmail, hashPassword],
    delete: [ limitAccess('admin') ]
  };

  private afterHooks: IHooksArray = {
    all: [],
    find: [],
    get: [],
    create: [scrubPassword],
    update: [scrubPassword],
    updateOrCreate: [scrubPassword],
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
    super(app, 'users', { exclusions: ['password', 'auth'] });

    this.configure('User', { before: this.beforeHooks, after: this.afterHooks, error: this.errorHooks });
  }

}

exports.initialize = (app: Application) => {
  return new UsersRoute(app);
}