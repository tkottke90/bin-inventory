import { html } from 'lit-html';
import { Router } from '../../router';
import styles from './not-found.module.css';

// == Types ==
import { PageComponent } from '../../components/page-component';
// ===========

const tag = 'not-found-component';

class NotFoundComponent extends PageComponent {

  render() {
    return html`
      <app-shell>
        <main class="${styles.mainContent}">
          <h1>404</h1>
          <p>This page does not exist</p>
          <mwc-button icon="home" label="Go Back Home" raised @click=${this.navigate('/')}></mwc-button>
        </main>
      </app-shell>
    `;
  }

  private navigate(url: string) {
    return async () => {
      Router.navigate(url);
    };
  }
}

customElements.define(tag, NotFoundComponent);

export {
  NotFoundComponent,
  tag
};