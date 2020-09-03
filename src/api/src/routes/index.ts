import express from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import Application from '../classes/application.class';

const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

/**
 * This module is designed to register express http endpoints.  Modules should be loaded into this file with the follwoing syntax:
 *
 *  Module: (app: Application) =>  void
 *
 * This format will allow the application to be passed onto those modules and routers assigned
 *
 * @param app Application instance
 */
export default async function routes(app: Application): Promise<void> {
  app.express.get('/', async (request: express.Request, response: express.Response) => {
    const packageJSON = await readFile(path.join(app.environment.CWD, 'package.json'), 'utf8');
    const { name, version, description, homepage } = JSON.parse(packageJSON);

    response.status(200).json({ name, version, description, homepage });
  });

  const directory = await readDir(path.resolve(__dirname));
  const routeFiles = directory.filter( (item) => /.*\.route\.(js|ts)$/.test(item));
  await Promise.all(routeFiles.map( async (file) => {
    app.logger.log('verbose', `Importing Route: ${file}`);
    await import(path.resolve(__dirname, file)).then( (module) => module.initialize(app));
  }));

}