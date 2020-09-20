import { fromFetch } from 'rxjs/fetch';

export class HTTPService {

  public static createHeaders(options: any): Headers {
    const headers = new Headers();
    for (const option in options) {
      headers.append(option, options[option]);
    }

    return headers;
  }

  public static get(url: string, options: Headers = new Headers()) {
    const request: RequestInit = { headers: options, method: 'GET' };
    return fromFetch(url, request);
  }

  public static post(url: string, data: any, options: Headers = new Headers()) {
    options.set('Content-Type', 'application/json;charset=UTF-8');
    const request: RequestInit = { body: JSON.stringify(data), headers: options, method: 'POST' };
    return fromFetch(url, request);
  }

  public static patch(url: string, data: any, options: Headers = new Headers()) {
    options.set('Content-Type', 'application/json;charset=UTF-8');
    const request: RequestInit = { body: JSON.stringify(data), headers: options, method: 'PATCH' };
    return fromFetch(url, request);
  }

  public static put(url: string, data: any, options: Headers = new Headers()) {
    options.set('Content-Type', 'application/json;charset=UTF-8');
    const request: RequestInit = { body: JSON.stringify(data), headers: options, method: 'PUT' };
    return fromFetch(url, request);
  }

  public static delete(url: string, options: Headers = new Headers()) {
    const request: RequestInit = { headers: options, method: 'DELETE' };
    return fromFetch(url, request);
  }

}