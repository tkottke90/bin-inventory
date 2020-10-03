import { Route } from './app/util/route';

const routes: Route[] = [
  new Route({
    icon: 'login',
    label: 'Login',
    path: '/login',
    promise: () => import('./app/pages/login/login'),
    render: true,
    tag: 'login-page'
  }),
  new Route({
    icon: 'home',
    label: 'Home',
    path: '/',
    promise: () => import('./app/pages/home/home'),
    render: true,
    tag: 'home-page'
  })
];

const getRoutes = (pages: Route[]): Route[] => {
  return pages.reduce((prev, curr) => {
    prev.push(curr);
    if (curr.children.length > 0) {
      prev.push(...curr.children);
    }

    return prev;
  }, [] as Route[]);
};

export {
  routes,
  getRoutes
};