import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

export default (opts = {}) => {
  const defaults = { };

  opts = Object.assign({}, defaults, opts);
  let inputs;

  return {
    name: 'inject', // this name will show up in warnings and errors
    options({ input }) {
      inputs = input;
      if (typeof inputs === "string") {
        inputs = [inputs];
      }
      if (typeof inputs === "object") {
        inputs = Object.values(inputs);
      }
    },
    generateBundle(_outputOptions, bundle) {
      let map = {};
      return Promise.all(inputs.map(id => this.resolveId(id))).then(resolvedInputs => {
          for (const key of Object.keys(bundle)) {
            const idx = resolvedInputs.findIndex(input => input in (bundle[key].modules || {}));
            if (idx !== -1) {
              map[inputs[idx]] = bundle[key].fileName;
            }
          }
          
          const indexPath = path.resolve(__dirname, 'dist/index.html');
          const index = fs.readFileSync(indexPath, 'utf8');
          const { document } = new JSDOM(index).window;
          const bootstrap = document.querySelector('script[src="assets/index.js"]');
          bootstrap.src = `./assets/${map['src/bootstrap.ts']}`
          // todo, this alllllll needs to be abstracted
          // this is MVP logic for the moment
          // future facing goal would be to dictate location of the script and types.
          fs.writeFileSync(indexPath, document.documentElement.outerHTML);
        }
      );
    }
  };
}