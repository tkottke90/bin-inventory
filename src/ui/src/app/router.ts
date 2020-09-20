import page from 'page';
import { Subject } from 'rxjs';
import { Route } from './util/route';
import { PageComponent } from './components/page-component';

export class Router {
  static currentRoute: Route;
  static currentRoute$: Subject<Route> = new Subject();
  static currentLocation: Location;

  static init(routes: Route[]) {
    routes.forEach((route, index) => {
      page(route.path, this.invoke(route));

      if (index === 0) {
        this.currentRoute = route;
        this.currentRoute$.next(this.currentRoute);
      }

      route.children.forEach((childRoute) => {
        childRoute.parent = route;
        childRoute.path = `${route.path}${childRoute.path}`;
        page(childRoute.path, this.invoke(childRoute));
      });
    });

    page.start();
  }

  static navigate(path: string) {
    page(path);
  }

  private static after(route: Route, ctx: PageJS.Context, next: () => void) {
    try {
      this.currentRoute = route;
      this.currentRoute$.next(this.currentRoute);
      route.after(route, ctx, next);
    } catch (error) {
      console.log(error);
    }
  }

  private static before(route: Route, ctx: PageJS.Context, next: () => void) {
    try {
      route.before(route, ctx, next);
      this.currentLocation = window.location;
    } catch (error) {
      console.log(error);
    }
  }

  private static invoke(route: Route) {
    return (ctx: PageJS.Context, next: () => void) => {
      this.invokeBefore(route, ctx, next);

      if (ctx.stopRender) {
        return;
      }

      route.promise()
        .then((response) => this.invokeSuccess(response, route, ctx, next))
        .catch((error) => this.invokeError(error, route, ctx, next))
        .finally(() => this.invokeFinally(route, ctx, next));
    };
  }

  private static invokeBefore(route: Route, ctx: PageJS.Context, next: () => void) {
    // spinner start
    this.before(route, ctx, next);
  }

  private static invokeSuccess(response: any, route: Route, ctx: PageJS.Context, next: () => void) {
    route.loaded = true;
    const prevPage = document.querySelector('.page.active') as HTMLElement;
    const nextPage = document.querySelector(response.tag) as PageComponent;

    if (prevPage) {
      prevPage.classList.remove('active');
    }
    nextPage.classList.add('active');
    nextPage.onActivated();

    window.scrollTo({
      behavior: 'smooth',
      top: 0
    });
    // page animation handler
    // todo: accept keyframes to execute via web animations api
  }

  private static invokeError(error: any, route: Route, ctx: PageJS.Context, next: () => void) {
    console.log(error);
  }

  private static invokeFinally(route: Route, ctx: PageJS.Context, next: () => void) {
    // spinner end
    this.after(route, ctx, next);
  }
}