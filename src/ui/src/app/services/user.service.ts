import { HTTPService } from './http.service';

export interface IUser {
  readonly id: number;
  firstName: string;
  lastName: string;
  readonly email: string;
  password?: string;
  type: string;
  active: boolean;
  settings?: any;
  auth?: any;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class UserService {

  public static find(query: string) {

  }

  public static get(id: number) {}

  public static create(user: IUser) {}

  public static createOrUpdate(id: number, user: IUser) {}

  public static update(id: number, user: Partial<IUser>) {}

  public static delete(id: number) {}

  private baseUrl = '/api/users'
}