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
  private user$: IUser | false = false;

  @property({ type: String })
  title: string = '';

  render() {
    // Get Document size
    const documentSizing = document.body.getBoundingClientRect();
    const isDesktop  = documentSizing.width > 600; // Media Query on 600px
    
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
          <div class="userDetails">
            <h3 class="avatar">T</h3>
            <h5 class="name">Thomas Kottke</h5>
            <h6 class="email">t.kottke90@gmail.com</h6>
          </div>
          <div class="userActions">
            <mwc-button class="drawerBtns" label="Account"></mwc-button>
            <mwc-icon-button icon="login"></mwc-icon-button>
          </div>
        </div>
        <div slot="appContent">
          <mwc-top-app-bar-fixed>
            <mwc-icon-button slot="navigationIcon" icon="menu" class="appHeaderMenuBtn" @click=${this.toggleDrawer}></mwc-icon-button>
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

  private logout() {
    AuthenticationService.logout();
  }
}

customElements.define(tag, AppShellComponent);

export {
  AppShellComponent,
  tag
}