// tslint:disable:no-empty

interface AppRoute {
  label: string;
  icon?: string;
  tag: string;
  render?: boolean;
}

interface IRoute extends AppRoute {
  path: string;
  loaded?: boolean;
  children?: Route[];
  parent?: Route;
  promise: () => Promise<any>;
  before?: (route: Route, ctx: PageJS.Context, next: () => void) => void;
  after?: (route: Route, ctx: PageJS.Context, next: () => void) => void;
}

class Route implements IRoute {
  path: string;
  loaded: boolean;
  tag: string;
  label: string;
  render: boolean;
  icon: string;
  children: Route[];
  parent?: Route;
  promise: () => Promise<any>;
  before: (route: Route, ctx: PageJS.Context, next: () => void) => void;
  after: (route: Route, ctx: PageJS.Context, next: () => void) => void;

  constructor(route: IRoute) {
    this.path = route.path;
    this.loaded = false;
    this.tag = route.tag;
    this.label = route.label;
    this.render = route.render ? route.render : false;
    this.icon = route.icon ? route.icon : '';
    this.children = route.children ? route.children : [];
    this.promise = route.promise;
    this.before = route.before ? route.before : () => {};
    this.after = route.after ? route.after : () => {};
  }
}

export {
  IRoute,
  AppRoute,
  Route
};
