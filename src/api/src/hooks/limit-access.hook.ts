import { IContext, IHook } from '../interfaces/routing.interfaces';

interface IOptions {
  role?: 'admin' | 'user',
  onlySame?: boolean
}

/**
 * Hook designed to limit a users access to an endpoint based on their 'type' and/or their id.
 * @param role Limit user to only access resource if their role allows them to
 * @param onlySame Limit user to only access resource if their account ID matches the ID in the url
 */
const limitAccess = (role: 'admin' | 'user' = 'admin', onlySame: boolean = false ) => {
  return async (context: IContext) => {
    const user = { ...context.user };
    const isAdmin = user.type === 'admin';
    const isUserResource = user.sub == context.params.id;

    if (!user) {
      context.app.logger.log('warn', `Failed annoymous attempt to access ${context.request.originalUrl}`);
      context.error = { _code: 403, message: 'Forbidden' };
      return context;
    }

    const errorContext = {
      user: user.sub,
      path: context.request.originalUrl
    }

    if (user.type !== role && !isAdmin) {
      context.app.logger.log('warn', `User attempt to access resource beyond their role`, { ...errorContext });
      context.error = { _code: 403, message: 'Forbidden'};
      return context;
    }

    if (isAdmin) {
      return context;
    }

    if (onlySame && !isUserResource) {
      context.app.logger.log('warn', `User attempt to access another user's resource and is not an admin`, { ...errorContext });
      context.error = { _code: 403, message: 'Forbidden'};
    }

    return context;
  }
}

export {
  limitAccess
}