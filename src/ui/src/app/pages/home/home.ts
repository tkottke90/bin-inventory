import { html } from 'lit-html';
import styles from './home.module.css'

import { PageComponent } from '../../components/page-component';

const tag = 'home-page';

class HomePage extends PageComponent {
  render() {
    return html`
      <app-shell title="Bin Inventory">
      </app-shell>
    `
  }
}

customElements.define(tag, HomePage);

export {
  HomePage,
  tag
};
