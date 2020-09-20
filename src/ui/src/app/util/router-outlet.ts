import { html } from 'lit-html';
import { BaseComponent } from '../components/base-component';

const tag = 'router-outlet';

class RouterOutlet extends BaseComponent {
  render() {
    console.log(this);

    return html`
      <slot></slot>
    `;
  }
}

customElements.define(tag, RouterOutlet);
