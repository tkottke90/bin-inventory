import { BehaviorSubject } from 'rxjs';
import { HTTPService } from './http.service';
import { AnalyticsService } from './analytics.service';
import { IUser, UserService } from './user.service';
import { Router } from '../router';

export type TUserRoles = 'admin' | 'user';

export interface IUserTokens {
  access?: string;
  id: string;
}

export class AuthenticationService {

  public static $user: BehaviorSubject<IUser | false> = new BehaviorSubject<IUser | false>(false);

  public static async init() {
    const returnToLogin = () => {
      const redirect = window.location.pathname.startsWith('/login') ? '' : `?redirect=${window.location.pathname}`;

      window.history.replaceState({}, '', `/login${redirect}`);
    }
    
    // Call server and get current user if cookies exist
    const response = await this.getUser().toPromise();
    if (response.error) {
      const details = { url: `${this.baseUrl}/get-user`, response: response.status, responseMessage: response.statusText }
      AnalyticsService.writeLog({ level: 'verbose', message: 'User access token attempt failed', meta: details});
      AnalyticsService.appendUserStory({ description: 'Application Init - User attempted to access route and token get failed', meta: details })
      returnToLogin();
      return;
    }

    if (!response.id) {
      returnToLogin();
    }

    const user = this.parseJWT(response.id);

    if (!user) {
      const details = { method: 'parseJWT', token: response.id };  
      AnalyticsService.writeLog({ level: 'verbose', message: 'Unable to parse ID token', meta: details });
      AnalyticsService.appendUserStory({ description: 'Application Init - User attempted to access route and token get failed', meta: details });
      window.history.replaceState({}, '', `/login`);
      return;
    }

    this.$user.next(user);
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

    if (response.error) {
      throw new Error(response.statusText);
    }

    const { id: idToken } = response;

    this.$user.next(
      this.parseJWT(idToken)
    );
  }

  public static loginWithWebAuthN() {}

  /**
   * Logout the current user by clearing the tokens and returning to the login page
   */
  public static logout(redirect: string = '') {
    this.$user.next(false);
    HTTPService.post(`${this.baseUrl}/logout`, {}).toPromise();
    Router.navigate(`/login${ redirect ? `?redirect=${redirect}` : ''}`);
  }

  private static baseUrl = '/api/auth'

  private static parseJWT(token: string) {
    const [ header, payload, signature ] = token.split('.');
    return JSON.parse(atob(payload));
  }

}