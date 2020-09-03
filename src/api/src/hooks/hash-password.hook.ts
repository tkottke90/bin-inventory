import { IContext } from '../interfaces/routing.interfaces';

const hashPassword = async (context: IContext) => {
  if (context.data.password) {

    context.data.password = await context.app.authentication.hashString(context.data.password);

    context.app.logger.log('info', `Password: ${context.data.password}`);
  }

  return context;
};

export {
  hashPassword
};
