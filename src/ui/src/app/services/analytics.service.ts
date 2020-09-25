import { HTTPService } from './http.service';

  type LogLevels = 'fatal' | 'error' | 'warn' | 'check' | 'info' | 'verbose' | 'debug' | 'silly';

  interface Log {
    level: LogLevels;
    message: string;
    meta: {
      [key: string]: any
    }
  }

  interface UserEvent {
    timestamp: number;
    description: string;
    userId: number;
    meta: {
      [key: string]: any;
    }
  }

  export class AnalyticsService {

    public static userStory: UserEvent[] = []

    public static appendUserStory(event: Partial<UserEvent>): void {
      const _event: UserEvent = Object.assign({ timestamp: new Date().valueOf(), description: '', userId: -1, meta: {} }, event);
      
      this.userStory.push(_event);
    }

    public static generateEventLog(level: LogLevels, message: string, meta: { [key: string]: any }): Log {
      return {
        level,
        message,
        meta
      }
    }

    public static writeLog(log: Partial<Log>) {
      const _log: Log = Object.assign({ level: 'debug', message: '', meta: {} }, log);

      HTTPService.post(this.baseUrl, _log, HTTPService.createHeaders({}));
    }

    public static writeStory() {
      this.writeLog({ level: 'info', message: 'User story', meta: { story: this.userStory } })
    }

    private static baseUrl = '/api/analytics'
  }
