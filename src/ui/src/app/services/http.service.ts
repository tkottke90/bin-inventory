import { fromFetch } from 'rxjs/fetch';
import { Router } from '../router';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export class HTTPService {

  public static createHeaders(options: any): Headers {
    const headers = new Headers();
    for (const option in options) {
      headers.append(option, options[option]);
    }

    return headers;
  }

  public static get(url: string, options: Headers = new Headers()) {
    // Generate request object (headers and method);
    const request: RequestInit = { headers: options, method: 'GET' };
    // Initialize fetch request and return Observable
    return fromFetch(url, request).pipe(
      // Pipe result to switchMap to process request
      switchMap(this.processResponse),
      catchError((error) => {
        return of({ error: true, message: error.message });
      })
    );
  }

  public static async getOrDefault(url: string, defaultValue: any, options: Headers = new Headers()) {
    const response = await this.get(url, options).toPromise();

    if (response.error) {
      return defaultValue;
    }

    return await response;
  }

  public static post(url: string, data: any, options: Headers = new Headers()) {
    options.set('Content-Type', 'application/json;charset=UTF-8');
    const request: RequestInit = { body: JSON.stringify(data), headers: options, method: 'POST' };
    return fromFetch(url, request).pipe(
      // Pipe result to switchMap to process request
      switchMap(this.processResponse),
      catchError((error) => {
        return of({ error: true, message: error.message });
      })
    );
  }

  public static patch(url: string, data: any, options: Headers = new Headers()) {
    options.set('Content-Type', 'application/json;charset=UTF-8');
    const request: RequestInit = { body: JSON.stringify(data), headers: options, method: 'PATCH' };
    return fromFetch(url, request).pipe(
      // Pipe result to switchMap to process request
      switchMap(this.processResponse),
      catchError((error) => {
        return of({ error: true, message: error.message });
      })
    );
  }

  public static put(url: string, data: any, options: Headers = new Headers()) {
    options.set('Content-Type', 'application/json;charset=UTF-8');
    const request: RequestInit = { body: JSON.stringify(data), headers: options, method: 'PUT' };
    return fromFetch(url, request).pipe(
      // Pipe result to switchMap to process request
      switchMap(this.processResponse),
      catchError((error) => {
        return of({ error: true, message: error.message });
      })
    );
  }

  public static delete(url: string, options: Headers = new Headers()) {
    const request: RequestInit = { headers: options, method: 'DELETE' };
    return fromFetch(url, request).pipe(
      // Pipe result to switchMap to process request
      switchMap(this.processResponse),
      catchError((error) => {
        return of({ error: true, message: error.message });
      })
    );
  }

  private static processResponse(response: Response) {
    // If response is ok (status < 400) return new observable that resolves response.json()
    if (response.ok) {
      return response.json();
    }

    HTTPService.resolveError(response);

    const error: any = new Error(response.statusText);
    error.code = response.status;
    error.error = true;
    error.data = response.json();

    // If response is not ok (status >= 400) return new observable that has one value with the error details
    return of(error);
  }

  private static resolveError(response: Response): Response | false {
    // Detect 401 and redirect to login
    if (response.status === 401) {
      const path = Router.currentLocation.pathname;
      Router.navigate(`/login?redirect=${path}`);
    }

    return response;
  }
}