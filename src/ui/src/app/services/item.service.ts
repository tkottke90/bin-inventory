import { HTTPService } from './http.service';


export class ItemService {
  public static count() {
    return HTTPService.get(`${this.baseUrl}/count`);
  }
  
  public static find() {}

  public static get(id: string) {}

  public static create() {}

  public static createOrUpdate() {}

  public static update() {}

  public static delete() {}

  private static baseUrl = '/api/items'
}