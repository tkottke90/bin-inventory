import { fromEvent } from 'rxjs';
import { first } from 'rxjs/operators'

// == Types ==
import { PageComponent } from '../components/page-component';
import { Snackbar } from '@material/mwc-snackbar';
// ===========

class SnackbarHelper {

  /**
   * Function to manage the showing of a snackbar
   * @param page Page that the snackbar resides on
   * @param timeout Duration of time the snackbar is visible.  Range: 4000 to 10000
   */
  public static showSnackbar(page: PageComponent, message: string, timeout: number = 4000) {
    const inputTimeout = this.normalizeTimeout(timeout);

    const snackbar = page.querySelector('mwc-snackbar') as Snackbar;

    if (snackbar) {
      snackbar.timeoutMs = inputTimeout;
      snackbar.labelText = message;
      snackbar.show();
    }

    return fromEvent(snackbar, 'MDCSnackbar:closed').pipe(first());
  }

  /**
   * Function to temporarily add a snackbar to the provided page.  Currently snackbars do not stack so they will overlap each other
   * @param {PageComponent} page Page the snackbar should be attached to.  This should be an internal page component
   * @param {string} message String to be displayed within the snackbar
   * @param {number} timeout Duration that the snackbar should show up on the page in ms.  Range 4000 to 10000
   */
  public static addSnackbar(page: PageComponent, message: string, timeout: number = 4000) {
    const snackbar = document.createElement('mwc-snackbar') as Snackbar;

    snackbar.labelText = message;
    snackbar.timeoutMs = this.normalizeTimeout(timeout);

    const closedEvent = fromEvent(snackbar, 'MDCSnackbar:closed');
    const closedEvent$ = closedEvent.subscribe(() => {
      page.removeChild(snackbar);
      closedEvent$.unsubscribe();
    });

    page.appendChild(snackbar);
    snackbar.show()
  }

  /**
   * Ensure that the timeout value passed to the snackbar is allowed.  The mwc-snackbar only allows -1 or a number between 4000 and 10000.
   * @param {number} timeout Millisecond value that represents the duration the snackbar will be open.
   *   Alternative is to return -1 which waits for the snackbar to be manually dismissed
   * @returns {number} A valid timeout value for the mwc-snackbar
   */
  private static normalizeTimeout(timeout: number): number {
    let inputTimeout = timeout;
    if (inputTimeout === -1) {
      return timeout;
    }

    if (inputTimeout < 4000) {
      inputTimeout = 4000;
    }

    if (inputTimeout > 10000) {
      inputTimeout = 10000;
    }

    return inputTimeout;
  }
}

export {
  SnackbarHelper,
  Snackbar
};