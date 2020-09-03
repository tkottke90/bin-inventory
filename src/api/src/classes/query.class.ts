import { FindOptions } from 'sequelize';

export const DEFAULT_LIMIT = 25;

export interface IQuery {
    [key: string]: string;
}

const validSortTerms = [ 'ASC', 'DESC', 'NULLS FIRST' ];

export class QueryClass {
    public limit: number;
    public skip: number;
    public paginate: boolean;
    public order: any;

    public query: IQuery;

    constructor(query: any) {
      this.limit = query.limit || DEFAULT_LIMIT;
      delete query.limit;

      this.skip = query.skip || 0;
      delete query.skip;

      this.paginate = query.hasOwnProperty('paginate') && query.paginate === 'false' ? false : true;
      delete query.paginate;

      this.order = !query.sort ? [ [ 'id', 'DESC' ] ] : Object.keys(query.sort).map( (item) => this.sortObjectToArray(query.sort, item));
      delete query.sort;

      this.query = query;
    }

    public toSequelizeQuery(): FindOptions {
      return {
        where: this.query,
        limit: this.limit,
        offset: this.skip,
        order: this.order
      };
    }

    private sortObjectToArray(parentObject: any, key: string) {
      if (!validSortTerms.includes(parentObject[key])) {
        return false;
      }

      return [ key, parentObject[key] ];
    }
  }
