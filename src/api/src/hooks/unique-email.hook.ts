import { IContext, IHook } from '../interfaces/routing.interfaces';

const uniqueEmail: IHook = async (context: IContext) => {
  if (!context.data.email) {
    return context;
  }

  const user = await context.app.database.model('User').findOne({
    where: { email: context.data.email }
  });

  switch(context.method) {
    case 'POST':
      if (user) {
        context.app.logger.log('verbose', 'User Exists with that email!', { email: context.data.email } );
        context.error = { _code: 409, message: 'Another user exists with that email'};
      }
      break;
    case 'PATCH':
    case 'PUT':
      if (user && user.get('id') !== Number(context.params.id)) {
        context.app.logger.log('verbose', 'User Exists with that email!', { email: context.data.email } );
        context.error = { _code: 409, message: 'Another user has that email'};
      }
      break;
  }

  return context;
};

export {
  uniqueEmail
};
