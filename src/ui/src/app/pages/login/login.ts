import { html } from 'lit-html';
import styles from './login.module.css'
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SnackbarHelper } from '../../util/snackbar-helper.util';

// == Types ==
import { PageComponent } from '../../components/page-component';
import { TextField } from '@material/mwc-textfield';
import { IUser } from '../../services/user.service';
// ===========

// == Services ==
import { AuthenticationService } from '../../services/authentication.service';
import { Router } from '../../router';
// ==============

// == Components ==
import '../../components/logo/logo';
// ================

const tag = 'login-page';

class LoginPage extends PageComponent {

  private disableInputs: boolean = false;
  private user$: IUser | false = false;

  firstUpdated() {
    const form = this.querySelector('form') as HTMLFormElement;
    const formElements = form.querySelectorAll('mwc-textfield');

    formElements.forEach((element) => {
      fromEvent<KeyboardEvent>(element, 'keypress')
        .pipe(debounceTime(250))
        .subscribe((event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            this.login();
          }
        });
    });
  }

  onActivated() {
    this.user$ = AuthenticationService.$user.value;
    
    console.dir(this.user$);
    this.requestUpdate();
  }

  render() {
    if (this.user$) {
      return html`${this.renderLoggedIn()}`
      return;
    }

    return html`
      <main class="${styles.content}">
        <div class="${styles.card}">
          <logo-component></logo-component>
      
          <form class="${styles.loginForm}">
            <mwc-textfield
              name="email"
              label="Email"
              outlined required
              ?disabled=${this.disableInputs}
              pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
            ></mwc-textfield>
            <mwc-textfield 
              name="password"
              label="Password" 
              outlined
              required 
              type="password"
              autocomplete
              ?disabled=${this.disableInputs}
            ></mwc-textfield>
            <div class="${styles.actions}">
              <mwc-button label="Login" type="submit" raised @click=${this.login} ?disabled=${this.disableInputs}></mwc-button>
            </div>
          </form>
        </div>
      </main>
      <mwc-snackbar></mwc-snackbar>
    `
  }

  private renderLoggedIn() {
    console.dir(this.user$);
    console.log('Render Logged In');

    const email = (this.user$ as IUser).firstName;

    return html`
      <main class="${styles.content}">
        <div class="${styles.card} ${styles.loggedIn}">
          <logo-component></logo-component>
      
          <h3>Already logged in:</h3>
          <div class="${styles.actions}">
            <mwc-button label="Continue as ${email}" raised @click=${this.navigate('/')}></mwc-button>

            <mwc-button label="Not ${email}? Sign Out" outlined @click=${this.logout}></mwc-button>
          </div>
        </div>
      </main>
    `;
  }

  private async login() {
    const setInputs = (state: boolean) => {
      this.disableInputs = state;
      this.requestUpdate();
    };

    setInputs(true);

    // Get Form and input elements
    const form = this.querySelector('form') as HTMLFormElement;
    const formElements = Array.from(form.querySelectorAll('mwc-textfield'));

    // Check validity
    const validity = formElements.map((element: TextField) => {
      const isValid = element.reportValidity();
      if (!isValid) {
        // If invalid, pull validity message from input to mwc-textfield
        const shadow = element.shadowRoot as ShadowRoot;
        const input = shadow.querySelector('input') as HTMLInputElement;

        element.validationMessage = this.customValidationMessages(input.validationMessage);
        this.requestUpdate();
      }
      return isValid;
    });

    // Return if any fields are invalid - they will have been updated by the validity check
    if (!validity.every((item) => item)) {
      setInputs(false);
      return;
    }

    // Get the values from the inputs
    const values: { email: string, password: string } = formElements.reduce((output, cur) => Object.assign(output, { [cur.name]: cur.value }), { email: '', password: '' });
    
    // Attempt to login
    try {
      await AuthenticationService.login(values.email, values.password);
      const snackbarClosed = SnackbarHelper.showSnackbar(this, 'Login Successful!');

      // On successful login - notify user and then navigate after snackbar closes
      snackbarClosed.subscribe(() => {
        this.successfulLoginNavigation();
        form.reset();
        setInputs(false);
      });
    } catch (error) {
      // TO-DO: Add Analytics Here?

      // Show error message snackbar
      SnackbarHelper.showSnackbar(this, `Error: ${this.customValidationMessages(error.message)}`);
      setInputs(false);
    }
  }

  /**
   * Custom lookup for common validation messages
   * @param {string} validationMessage Standard validation message produced by an input element or HTTP response
   * @returns {string} Custom message if one exists, otherwise it returns the message sent in
   */
  private customValidationMessages(validationMessage: string) {
    const customMessages = [
      { Key: 'Please match the requested format.', Value: 'Invalid email' },
      { Key: 'Unauthorized', Value: 'Invalid username or password' }
    ]

    const message = customMessages.find((message) => message.Key === validationMessage);

    if (!message) {
      return validationMessage;
    }

    return message.Value;
  }

  /**
   * Trigger navigation to move the user into the application.  If a redirect query param is provided, that path is used to route.
   *   Otherwise the user is taken to the root route '/'
   */
  private successfulLoginNavigation() {
    const query = window.location.search;
    if (query.includes('redirect')) {
      const queryParams = query
        .slice(1)
        .split('&')
        .map((queryItem: string) => {
          const [key, value] = queryItem.split('=');
          return { key, value };
        });

      const redirect = queryParams.find((item: any) => item.key === 'redirect');

      if (redirect) {
        Router.navigate(redirect.value);
        return;
      }
    }

    Router.navigate('/');
  }

  private logout() {
    AuthenticationService.logout();
  }
}

customElements.define(tag, LoginPage);

export {
  LoginPage,
  tag
};