import init from './app/index';
import { Router } from './app/router';
import { routes } from './bootstrap.routes';

(async () => {
  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) { return; }

        refreshing = true;
        window.location.reload();
      }
    );

    navigator.serviceWorker.register('./service-worker.js');
  }

  const preInitializeFunctions = Promise.all([
    // Add functions that happen before 1st render here
  ]);
  
  preInitializeFunctions.finally(() => {
    Router.init(routes);
    init();
  });
})();
