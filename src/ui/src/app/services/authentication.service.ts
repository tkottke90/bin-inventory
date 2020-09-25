import { BehaviorSubject } from 'rxjs';
import { HTTPService } from './http.service';
import { AnalyticsService } from './analytics.service';
import { UserService } from './user.service';

export type TUserRoles = 'admin' | 'user';

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  settings: any;
  auth?: any;
  createdAt: string;
  updatedAt: string;
}

export interface IUserTokens {
  access: string;
  id: string;
}

export class AuthenticationService {

  public static $user: BehaviorSubject<IUser | null> = new BehaviorSubject<IUser | null>(null);

  public static async init() {
    const returnToLogin = () => {
      window.history.replaceState({}, '', `/login?redirect=${window.location.pathname}`);
    }
    
    // Call server and get current user if cookies exist
    const response = await this.getUser().toPromise();
    if (!response.ok) {
      const details = { url: `${this.baseUrl}/get-user`, response: response.status, responseMessage: response.statusText }
      AnalyticsService.writeLog({ level: 'verbose', message: 'User access token attempt failed', meta: details});
      AnalyticsService.appendUserStory({ description: 'Application Init - User attempted to access route and token get failed', meta: details })
      returnToLogin();
      return;
    }
    
    const result: IUserTokens = await response.json();

    if (!result.access || !result.id) {
      returnToLogin();
    }

    const user = this.parseJWT(result.id);
    
    if(!user) {
      const details = { method: 'parseJWT', token: result.id };  
      AnalyticsService.writeLog({ level: 'verbose', message: 'Unable to parse ID token', meta: details });
      AnalyticsService.appendUserStory({ description: 'Application Init - User attempted to access route and token get failed', meta: details })
      return returnToLogin();
    }
  }

  public static getUser() {
    const headers = HTTPService.createHeaders({});
    return HTTPService.get(`${this.baseUrl}/get-user`, headers)
  }

  public static userCanAccess(role: 'admin') {}

  public static async login(username: string, password: string) {
    const token = btoa(`${username}:${password}`);
    const headers = HTTPService.createHeaders({ Authorization: `Basic ${token}` });

    const response = await HTTPService.post(`${this.baseUrl}/login`, {}, headers).toPromise();

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const { idToken } = await response.json();

    UserService.$user.next(
      this.parseJWT(idToken)
    );
  }

  public static loginWithWebAuthN() {}

  public static logout() {}

  private static baseUrl = '/api/auth'

  private static parseJWT(token: string) {
    const [ header, payload, signature ] = token.split('.');
    return JSON.parse(atob(payload));
  }

}