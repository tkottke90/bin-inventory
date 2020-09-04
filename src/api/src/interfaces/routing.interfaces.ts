import Application from '@classes/application.class';
import { Request, Response } from 'express';

export type TRouteMethods = 'get' | 'post' | 'patch' | 'put' | 'delete' | 'options';

export interface IRoute {
  method: TRouteMethods;
  path: string;
  action: (context: IContext) => any;
  beforeHooks?: IHook[];
  afterHooks?: IHook[];
  errorHooks?: IHook[];
}

export interface IContext {
  readonly request: Request;
  readonly response: Response;
  readonly app: Application;
  readonly params: { [key: string]: any };
  readonly query: { [key: string]: any };
  user: any;
  readonly method: string;
  data?: any;
  file?: any;
  result?: any;
  error?: any;
}

export type IHook = (context: IContext) => IContext | Promise<IContext>;

export interface IHooksArray {
  all: IHook[];
  find: IHook[];
  get: IHook[];
  create: IHook[];
  update: IHook[];
  updateOrCreate: IHook[];
  delete: IHook[];
}

export interface IModelHooks {
  before: IHooksArray;
  after: IHooksArray;
  error: IHooksArray;
}
