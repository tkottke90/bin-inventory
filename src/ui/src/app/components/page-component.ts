import { BaseComponent } from './base-component';
import { Route } from '../util/route';
import { Router } from '../router';

class PageComponent extends BaseComponent {
    /**
     * Function called by router when a page component is set as active
     */
    public onActivated(response: any, route: Route, ctx: PageJS.Context, next: () => void): void {
        return;
    }

    public navigate(path: string) {
      return ($event?: any) => {
          Router.navigate(path);
      };
    }
}

export {
    PageComponent
};