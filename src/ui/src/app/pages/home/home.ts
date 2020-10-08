import { html } from 'lit-html';
import styles from './home.module.css'

// == Types ==
import { PageComponent } from '../../components/page-component';
import { IUser } from '../../services/user.service';
// ===========

// == Service ==
import { AuthenticationService } from '../../services/authentication.service';
// =============

const tag = 'home-page';

class HomePage extends PageComponent {

  private user$: IUser | false = false;
  private disableScan: boolean = false;

  firstUpdated() {
    AuthenticationService.$user.subscribe((user) => {
      this.user$ = user;
      this.requestUpdate();
    })

    navigator
      .permissions
      .query({ name: 'camera' })
      .then(result => {
        this.disableScan = result.state === 'denied';
        this.requestUpdate();
        result.onchange = ($event: any) => {
          this.disableScan = $event.target.state === 'denied';
          this.requestUpdate();
        }
      })
  }

  onActivated() {
    this.user$ = AuthenticationService.$user.value;
  }

  render() {

    if (!this.user$) {
      return html`
        <app-shell disableMenu>
          <main class="${styles.noUser}">
            <h3>Oops!</h3>
            <p>Looks like you are not logged in</p>
            <mwc-button icon="login" label="Return to Login" raised></mwc-button>
          </main>
        </app-shell>
      `;
    }

    return html`
      <app-shell title="Bin Inventory">
        <main class="${styles.content}">
          <div class="card ${styles.getStarted}">
            <h4>Welcome Back!</h4>  
            ${ this.disableScan ? 
              html`<mwc-button warn raised label="Unavailable" trailingIcon icon="error"></mwc-button>` :
              html`<mwc-button raised label="Find My Stuff" trailingIcon icon="qr_code_scanner"></mwc-button>`
            }
          </div>
          <div class="card ${styles.itemDetails}">
            <h5>Items</h5>
            <p class="${styles.itemCount}">Total: ${0}</p>
            <div class="${styles.actions}">
              <mwc-button label="View" raised></mwc-button>
            </div>
          </div>
          <div class="card ${styles.containerDetails}">
            <h5>Containers</h5>
            <p class="${styles.itemCount}">Total: ${0}</p>
            <div class="${styles.actions}">
              <mwc-button label="View" raised></mwc-button>
            </div>
          </div>
        </main>
      </app-shell>
    `
  }
}

customElements.define(tag, HomePage);

export {
  HomePage,
  tag
};
