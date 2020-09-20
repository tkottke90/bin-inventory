import { html } from 'lit-html';
import styles from './home.module.css'

import { PageComponent } from '../../components/page-component';

const tag = 'home-page';

class HomePage extends PageComponent {
  render() {
    return html`
      <style></style>
      <h1 class=${styles.header}>CRA Project Framework</h1>
      <main>
        <h4>Welcome to the CRA Framework,</h4>
        <p><strong>Tools:</strong> Typescript, PageJS, RollupJS</p>
      </main>
    `
  }
}

customElements.define(tag, HomePage);

export {
  HomePage,
  tag
};
