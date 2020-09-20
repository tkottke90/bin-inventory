const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readDir = promisify(fs.readdir);

const express = require('express');

module.exports = async (app) => {

  app.use(express.static(path.resolve(__dirname, '..', app.env.DIST_DIR)));

  
  // Automatic route file detection
  const dir = await readDir(path.resolve(__dirname));

  const routeFiles = dir.filter( item => /.*\.route\.(js|ts)$/.test(item));
  await Promise.all(routeFiles.map(async file => {
    app.logger.log('verbose', `Importing Route File: ${file}`);
    try {
      await import(path.resolve(__dirname, file)).then( module => module.default(app));
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }));

  app.all('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', app.env.DIST_DIR, 'index.html'));
  })
}