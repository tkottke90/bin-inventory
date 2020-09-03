import { IContext, IHook } from '@interfaces/routing.interfaces';

const scrubPassword: IHook = (context: IContext) => {
  if (context.result.password) {
    delete context.result.password;
  }

  return context;
};

export {
  scrubPassword
};
