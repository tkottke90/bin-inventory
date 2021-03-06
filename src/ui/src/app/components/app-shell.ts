import { LitElement, property } from 'lit-element';
import { html, TemplateResult } from 'lit-html';

// == Services ==
import { Router } from '../router';
import { AuthenticationService } from '../services/authentication.service';
// ==============

// == Types ==
import { IUser } from '../services/user.service';
// ===========

const tag = 'app-shell';

class AppShellComponent extends LitElement {

  private showDrawer: boolean = false;

  @property({ type: String })
  title: string = '';

  @property({ type: Boolean })
  disableMenu: boolean = false;

  render() {
    // Get Document size
    // const documentSizing = document.body.getBoundingClientRect();
    // const isDesktop  = documentSizing.width > 600; // Media Query on 600px

    return html`
      <style>
        :host {
          --avatar-size: 2.25rem;
        }

        .drawerTitle {
          border-bottom: 1px solid #0003;
        }    

        .drawerBtns > mwc-button {
          width: 100%;
        }
        .drawerBtns > h4 {
          padding: 0.5rem 0;
          text-align: center;
          margin: 0 0.5rem;
          border-bottom: 1px solid #0003;
        }

        .userDetails {
          display: grid;
          grid-template-columns: 3rem 1fr;
          grid-template-rows: 1fr 1fr;
        }

        .avatar {
          grid-column: 1;
          grid-row: 1/3;
          margin: 0 auto;

          width: var(--avatar-size);
          height: var(--avatar-size);

          display: flex;
          justify-content: center;
          align-items: center;

          border-radius: 50%;
          color: #fff;
          background-color: orange;
        }

        .name {
          grid-column: 2;
          grid-row: 1;
          
          margin: 0;
        }

        .email {
          grid-column: 2;
          grid-row: 2;
          
          margin: 0;

          opacity: 0.5;
        }

        .userActions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

      </style>
      <mwc-drawer hasHeader type="modal" ?open=${this.showDrawer} @MDCDrawer:closed=${this.closeDrawer}>
        <div slot="title" class="drawerTitle">
          ${this.renderUserDetails()}
          <div class="userActions">
            <mwc-button class="drawerBtns" label="Account"></mwc-button>
            <mwc-icon-button icon="login" @click=${this.logout}></mwc-icon-button>
          </div>
        </div>
        <div slot="appContent">
          <mwc-top-app-bar-fixed>
            ${ this.disableMenu ? '' : html`<mwc-icon-button slot="navigationIcon" icon="menu" class="appHeaderMenuBtn" @click=${this.toggleDrawer}></mwc-icon-button>` }
            <div slot="title">Bin Inventory</div>
            <slot></slot>
            
          </mwc-top-app-bar-fixed>
        </div>
        <div class="drawerBtns">
          ${this.renderDrawerButtons()}
        </div>
     </mwc-drawer>
    `
  }

  public toggleDrawer() {
    this.showDrawer = !this.showDrawer;
    this.requestUpdate();
  }

  private async closeDrawer() {
    this.showDrawer = false;
    await this.requestUpdate();
  }

  private navigate(url: string) {
    return async () => {
      await this.closeDrawer();
      Router.navigate(url);
    };
  }

  private renderDrawerButtons() {
    return html``;
  }

  private renderUserDetails() {

    const user = AuthenticationService.$user.value;

    if (!user) {
      return html``;
    }

    const _userDetails = user as IUser;

    return html`
      <div class="userDetails">
        <h3 class="avatar">${_userDetails.firstName.slice(0, 1).toUpperCase()}</h3>
        <h5 text-ellipsis class="name">${_userDetails.firstName} ${_userDetails.lastName}</h5>
        <h6 text-ellipsis class="email">${_userDetails.email}</h6>
      </div>
    `;
  }

  private logout() {
    AuthenticationService.logout();
  }
}

customElements.define(tag, AppShellComponent);

export {
  AppShellComponent,
  tag
}