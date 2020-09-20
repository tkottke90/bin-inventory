import { html } from 'lit-html';
import styles from './home.module.css'

import { PageComponent } from '../../components/page-component';

const tag = 'home-component';

class HomeElement extends PageComponent {
  render() {
    return html`
      <style></style>
      <h1 class=${styles.header}>CRA Project Framework</h1>
    `
  }
}

customElements.define(tag, HomeElement);

export {
  HomeElement,
  tag
};
