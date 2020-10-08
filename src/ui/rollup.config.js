import nodeResolve from 'rollup-plugin-node-resolve';
import typescript2 from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import image from '@rollup/plugin-image';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';
import workbox from 'rollup-plugin-workbox-inject';

import inject from './build-util/inject';

const main = {
  input: ['src/bootstrap.ts'],
  output: {
    format: 'esm',
    dir: 'dist/assets',
    entryFileNames: 'bootstrap-[hash].js',
    sourcemap: true
  },
  plugins: [
    copy({
      targets: [
        { src: 'src/app/index.html', dest: 'dist/' },
        { src: 'src/app/404.html', dest: 'dist/' },
        { src: 'src/app/index.css', dest: 'dist/' },
        { src: 'src/app/favicon.ico', dest: 'dist/' },
        { src: 'src/app/util/manifest.webmanifest', dest: 'dist/' }
      ]
    }),
    nodeResolve(),
    typescript2(),
    postcss({
      writeDefinitions: true
    }),
    terser({ ecma: 8 }),
    image(),
    inject(),
  ]
}

const service_worker = {
  input: 'src/app/util/service-worker.js',
  output: {
    dir: 'dist/',
    format: 'esm',
    sourcemap: false
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    }),
    nodeResolve({
      browser: true,
    }),
    workbox({
      globDirectory: 'dist/',
      globPatterns: [
        '**/*.js',
        'index.css',
        'index.html',
        'favicon.ico'
      ],
      additionalManifestEntries: [
        'https://fonts.googleapis.com/css?family=Comfortaa',
        'https://fonts.googleapis.com/css?family=Material+Icons&display=block'
      ]
    }),
    terser(),
  ]
}

const non_service_worker = {
  input: 'src/app/util/service-worker.js',
  output: {
    dir: 'dist/',
    format: 'esm',
    sourcemap: false
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    }),
    nodeResolve({
      browser: true,
    }),
    terser(),
  ]
}

export default commandLineArgs => {
  const output = [ main ];
  if (commandLineArgs.configSW === true) {
    output.push(service_worker);
  } else {
    output.push(non_service_worker);
  }

  return output;
}