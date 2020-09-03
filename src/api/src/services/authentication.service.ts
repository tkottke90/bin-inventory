import passport from 'passport';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 } from 'uuid';
import express from 'express';

import Application from '../classes/application.class';
import { Sequelize } from 'sequelize/types';
import { Logger } from './logger.service';

import { Strategy as JWTStrategy } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { BasicStrategy } from 'passport-http';

import { IContext } from '@interfaces/routing.interfaces';

const FIFTEEN_DAYS = 60 * 60 * 24 * 15;

export default class AuthenticationService {
  public logger: Logger;
  public secret: string;
  public salt: number;
  public iss: string;
  public tokenLifespan: number;

  public database: Sequelize;

  private cookieOptions = (devEnv: boolean, expiration: number) => ({
    secure: !devEnv,
    sameSite: true,
    httpOnly: true,
    path: '/',
    maxAge: expiration * 1000
  });

  constructor(app: Application) {
    this.iss = app.environment.HOSTNAME;
    this.database = app.database;
    this.logger = app.logger;
    this.secret = app.environment.SECRET;
    this.salt = app.environment.SALT;
    this.tokenLifespan = app.environment.TOKEN_LIFESPAN || 1200;

    this.configureLocalAuth(app);
    this.configureBasicAuth(app);
    this.configureJWTAuth();

    app.express.use(passport.initialize());
  }

  public basicAuth = (context: IContext) => {
    return new Promise((resolve, reject) => {
      passport.authenticate('basic', async (error, user, message) => {
        if (error) {
          this.logger.log('error', 'Error authenticating basically', { error });
          reject({ code: 500, message });
          return;
        }

        if (!user) {
          this.logger.log('warn', 'Failed Login Attempt');
          reject({ code: 401, message });
          return;
        }

        resolve(this.generateTokens(user, context));
      })(context.request, context.response);
    });
  }

  public localAuth = (context: IContext) => {
    return new Promise((resolve, reject) => {
      passport.authenticate('local', async (error, user, message) => {
        if (error) {
          this.logger.log('error', 'Error authenticating basically', { error });
          reject({ code: 500, message });
          return;
        }

        if (!user) {
          this.logger.log('warn', 'Failed Login Attempt');
          reject({ code: 401, message });
          return;
        }

        resolve(this.generateTokens(user, context));
      })(context.request, context.response);
    });
  }

  public jwtAuth = (context: IContext) => {
    return new Promise<IContext>((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, async (error, user, message) => {
        if (error) {
          this.logger.log('error', 'Error authenticating with jwt', { error });
          context.error = { _code: 500, message };
          resolve(context);
          return;
        }

        // If the meesage object is present, there is an issue
        if (message) {
          // If the access token has been removed from the browser check if there is a refresh token and update if needed
          if (message.message === 'No auth token' && context.request.cookies['session-refresh']) {
            this.logger.log('verbose', 'No Auth Token Provided, checking refresh token');
            // Get User
            const db = context.app.database.model('User');
            const userId = context.request.cookies['session-refresh'].split('.')[0]; // Id is listed as first part of token

            const result = await db.findOne({ where: { [db.primaryKeyAttribute]: userId } })
            const _user: any = await result.get({ plain: true });
            const auth = _user.auth || {};
            // Compare refresh token provided with the one for that user
            if (auth.refresh === context.request.cookies['session-refresh']) {
              user = _user;
              delete user.auth;
              this.generateTokens(_user, context, true);
            }
          }
        }

        if (!user) {
          this.logger.log('warn', 'Failed Login Attempt');
          context.error = { _code: 401, message };
          resolve(context);
          return;
        }

        delete user.password;
        context.user = user;

        resolve(context);
      })(context.request, context.response);
    });
  }

  public refreshToken = async (token: string): Promise<string | boolean> => {
    const validToken = jwt.verify(token, this.secret);

    if (validToken) {
      const tokenContents: any = jwt.decode(token);

      const { User } = this.database.models;

      const user = await User.findOne({ where: { id: tokenContents.id } });

      return jwt.sign(user, this.secret, { algorithm: 'HS512', expiresIn: this.tokenLifespan });
    }

    return false;
  }

  public async hashString(password: string) {
    this.logger.log('debug', 'Values', { password, salt: this.salt });
    return await bcrypt.hash(password, this.salt);
  }

  public scrubPasswords(object: any) {
    const _objectWithPassword = object;
    delete _objectWithPassword.password;
    return _objectWithPassword;
  }

  public async getUser(token: string) {
    const tokenContents: any = jwt.decode(token);

    const { User } = this.database.models;

    return await User.findOne({ where: { id: tokenContents.id } });
  }

  public createTokenFromObject = async (payload: any) => {
    return await jwt.sign(payload, this.secret, { algorithm: 'HS512' });
  }

  private generateTokens = async (user: any, context: IContext, skipRefresh: boolean = false) => {
    const accessTokenID = v4();

    const id = await jwt.sign(user, this.secret, { algorithm: 'HS512', expiresIn: this.tokenLifespan });
    const access = await jwt.sign({
      username: user.email,
      sub: user.id,
      iss: this.iss,
      jti: accessTokenID,
      type: user.type
    }, this.secret, { algorithm: 'HS512', expiresIn: this.tokenLifespan });
    
    this.logger.log('info', `User successfully logged in`, { user: user.email, jti: accessTokenID });

    context.response.cookie('session-access', access, this.cookieOptions(context.app.environment.IS_DEVELOPMENT, this.tokenLifespan));
    if (!skipRefresh) {
      const refresh = `${user.id}.${crypto.randomBytes(40).toString('hex')}`;
      context.response.cookie('session-refresh', refresh, this.cookieOptions(context.app.environment.IS_DEVELOPMENT, FIFTEEN_DAYS));
    
      // Set refresh token in users auth object
      if (user.auth) {
        user.auth.refresh = refresh;
      } else {
        user.auth = { refresh };
      }
    }

    const db = context.app.database.model('User');
    const query = { [db.primaryKeyAttribute]: user.id }
    db.update(user, { where: query });

    return { id }
  }

  private configureLocalAuth(app: Application) {
    passport.use(new LocalStrategy(
      { usernameField: 'email', session: false },
      async (username: string, password: string, done: (...args: any[]) => any) => {
        try {
          const { User } = app.database.models;

          const user: any = await User.findOne({ where: { email: username } });

          if (!user) {
            return done(null, false, { message: 'Invalid Username or Password' });
          }

          if (!user.active) {
            return done(null, false, { message: 'Deactivated User' });
          }

          const isMatch = await bcrypt.compare(password, user.dataValues.password);

          if (!isMatch) {
            return done(null, false, { message: 'Invalid Credentials' });
          }

          done(null, user.get({ plain: true }));

        } catch (err) {
          done(err);
        }
      }
    ));
  }

  private configureBasicAuth(app: Application) {
    passport.use(new BasicStrategy(
      async (username: string, password: string, done: (...args: any[]) => any) => {
        try {
          const { User } = app.database.models;

          const user: any = await User.findOne({ where: { email: username } });

          if (!user) {
            return done(null, false, { message: 'Invalid Username or Password' });
          }

          if (!user.active) {
            return done(null, false, { message: 'Deactivated User' });
          }

          const isMatch = await bcrypt.compare(password, user.dataValues.password);

          if (!isMatch) {
            return done(null, false, { message: 'Invalid Credentials' });
          }

          done(null, user.get({ plain: true }));

        } catch (err) {
          done(err);
        }
      }
    ));
  }

  private configureJWTAuth() {
    const extractFromCookie = (request: express.Request) => {
      let token = null;

      if (request && request.cookies) {
        token = request.cookies['session-access'];
      }

      return token;
    }

    passport.use(new JWTStrategy({
      secretOrKey: this.secret,
      jwtFromRequest: extractFromCookie,
      algorithms: ['HS512']
    }, (jwtPayload, done) => done(null, jwtPayload)));
  }
}