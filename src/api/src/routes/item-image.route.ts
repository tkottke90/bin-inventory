import BaseRoute from '../classes/base-route.class';
import Application from '../classes/application.class';
import fileUpload from 'express-fileupload';

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

import ItemRoute from './items.route';

import { IHooksArray, IContext } from '../interfaces/routing.interfaces';
import { limitAccess } from '../hooks/limit-access.hook';

export default class ItemImageRoute extends BaseRoute {

  private beforeHooks: IHooksArray = {
    all: [ this.app.authentication.jwtAuth ],
    find: [ limitAccess('user') ],
    get: [ limitAccess('user') ],
    create: [ limitAccess('user') ],
    update: [ limitAccess('user') ],
    updateOrCreate: [ limitAccess('user') ],
    delete: [ limitAccess('user') ]
  };

  private afterHooks: IHooksArray = {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    updateOrCreate: [],
    delete: []
  };

  private errorHooks: IHooksArray = {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    updateOrCreate: [],
    delete: []
  };

  private storageLocation: string;

  constructor(app: Application) {
    super(app, '/item-images');

    this.router.use(fileUpload());
    this.storageExists(app);

    this.setup({
      routes: [
        { method: 'get' , path: '/:id', action: this.getFile, beforeHooks: [ ...this.beforeHooks.all, ...this.beforeHooks.create ]},
        { method: 'post', path: '/', action: this.uploadFile, beforeHooks: [ ...this.beforeHooks.all, ...this.beforeHooks.create ] }
      ]
    })
  }

  public getFile = (context: IContext) => {
    return new Promise(async (resolve, reject) => {
      // Validate file exists
      const filePath = path.resolve(this.storageLocation, context.params.id)
      const fileExists = await exists(filePath);

      if (!fileExists) {
        reject({
          _code: 404,
          message: 'File Not Found'
        });
      }

      // Return file
      context.file = filePath;

      resolve({ file: filePath });
    });
  }

  public uploadFile = (context: IContext) => {
    const itemService = context.app.services['/items'] as ItemRoute;
    return new Promise(async (resolve, reject) => {
      // Validate Input
      const files = context.request.files;
      const body = context.data;
      if (!files || Object.keys(files).length === 0 || !body || !body.item) {
        const item = !!body && !!body.item
        reject({ _code: 400, message: 'Bad Request', parts: { file: !!files, item } });
        return;
      }

      // Verify Item Exists
      let item: any;
      try {
        const findItemContext = { ...context };
        findItemContext.params = { id: body.item };
        findItemContext.query = {};
        findItemContext.data = {};
        item = await itemService.getById(findItemContext);
      } catch (error) {
        context.app.logger.error(error);
        reject(error)
        return;
      }

      // Upload File
      const file: fileUpload.UploadedFile = Array.isArray(context.request.files) ? context.request.files[0] : context.request.files.file;
      const filename = await this.findNextFilename(this.storageLocation, file.name);
      const filePath = path.resolve(this.storageLocation, filename);

      try {
        await this.saveFile(filePath, file.mv);
      } catch (error) {
        context.app.logger.error(error);
        reject(error)
        return;
      }

      // Update Item
      try {
        const itemUpdateData = { ...context };
        itemUpdateData.method = 'PATCH';
        itemUpdateData.params = { id: body.item }
        itemUpdateData.data = { lastChangedBy: context.user.sub, imageUrl:  filePath };
        await itemService.patch(itemUpdateData);
      } catch (error) {
        context.app.logger.error(error);
        reject(error)
        return;
      }

      resolve({
        item: item.id,
        image: filePath
      });
    });
  }

  private storageExists = (app: Application) => {
    this.storageLocation = path.resolve(process.cwd(), 'files');
    exists(this.storageLocation).then( async result => {
      if (!result) {
        app.logger.log('debug', 'File storage location missing, creating directory...', { result, directory: this.storageLocation });
        await mkdir(this.storageLocation, { recursive: true });
        return;
      }
      app.logger.log('debug', 'File storage directory exists', { result, directory: this.storageLocation });
    });
  }

  private saveFile = (filename: string, mv: (filename: string, callback: (error: any) => void) => any) => {
    return new Promise( async (resolve, reject) => {
      mv(filename, (err) => {
        if (err) {
          reject(err);
        }

        resolve(true)
      });
    })
  }

  private findNextFilename = async (location: string, filename: string, count: number = -1): Promise<string> => {
    const [ name, ...extensions ] = filename.split('.');
    const _filename = `${name}${ count === -1 ? '' : `_${count}` }.${extensions.join('.')}`;
    const fileExists = await exists(
      path.resolve(location, `${_filename}`)
    );

    if (fileExists) {
      return await this.findNextFilename(location, filename, count + 1);
    }

    return path.resolve(location, _filename);
  }
}

exports.initialize = (app: Application) => {
  return new ItemImageRoute(app);
}
