import BaseRoute from '../classes/base-route.class';
import UsersRoute from './users.route';
import Application from '../classes/application.class';

import { IContext, IRoute } from '../interfaces/routing.interfaces';
import mailerService from '../services/mailer.service';
import { MailerClass } from '../services/mailer.service';
import User from '../models/users.model';
import { uniqueEmail } from '../hooks/unique-email.hook';
import { hashPassword } from '../hooks/hash-password.hook';
import { scrubPassword } from '../hooks/scrub-password.hook';

export default class AuthRoute extends BaseRoute {

  private mailer: MailerClass;

  constructor(app: Application) {
    super(app, '/auth');

    const routes: IRoute[] = [
      { method: 'post', path: '/login', action: app.authentication.basicAuth },
      { method: 'post', path: '/logout', action: this.logout },
      { method: 'get', path: '/get-user', action: this.getIDToken, beforeHooks: [ app.authentication.jwtAuth ] },
      { method: 'get', path: '/forgot', action: this.forgotPassword }
    ]

    if (app.environment.EMAIL_ENABLED) {
      routes.push({ method: 'post', path: '/sign-up', action: this.signUp, beforeHooks: [ uniqueEmail, hashPassword ], afterHooks: [ scrubPassword ] });
      routes.push({ method: 'get', path: '/validate-email/:token', action: this.validateEmail });

      this.mailer = mailerService(app) as MailerClass;
    }

    this.setup({
      routes
    });
  }

  private getIDToken = (context: IContext) => {
    return new Promise(async (resolve, reject) => {
      resolve({
        access: context.request.cookies['session-access'],
        id: await context.app.authentication.createTokenFromObject(context.user)
      });
    });
  }

  private signUp = (context: IContext) => {
    return new Promise(async (resolve, reject) => {
      const Users = context.app.services['/users'] as UsersRoute;
      const createResult = await Users.post(context) as User;

      const emailToken = context.app.authentication.generateEmailVerificationCode(createResult, context);
      const domain = context.app.environment.HOSTNAME;
      const emailURL = `${domain}/auth/validate-email/${emailToken}`;

      const emailTemplate = `
<!DOCTYPE html>
<html>
  <head>
      <meta name="viewport" content="width=device-width">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <title>Email Verification Template</title>
  </head>
  <body style="margin: 0; width: 100vw: height: 100vh;">
  <header style="width: 100%; background-color: #9BC7D5; padding: 0.5rem; font-weight: bold;">Bin Inventory</header>
  <main style="padding: 0.5rem;">
  <h4>Welcome ${createResult.firstName}!</h4>
      <p style="font-size: 14px; font-weight: normal;">We need to verify that you own the email address associated with an accoun that was just created.  If you did, click this link to verify: <a href="${emailURL}">${emailURL}</a></p>
      <p style="font-size: 14px; font-weight: normal;">If you did not create an account, please disregard this email.</p>
      <p>Thank You</p>
  </main>
  </body>
</html>
`

      try {
        const _user = {...createResult} as any;
        delete _user.code;
        _user.auth = { emailVerified: false, emailToken };

        const db = context.app.database.model('User');
        const query = { [db.primaryKeyAttribute]: _user.id }
        const result: any = await db.update(_user, { where: query, returning: true });
      } catch (err) {
        context.app.logger.error(err)
        reject({ _code: 500, message: 'Internal server error' });
      }

      // Remove auth block before returning
      delete createResult.auth;


      // Incase admin tried to configure email incorrectly, catch and log
      if (!context.app.environment.HAS_EMAIL) {
        context.app.logger.log('info', 'Skipping verification email, nodemailer verification failed');
        resolve(createResult);
        return;
      }

      // Send notification email to new user
      try {
        this.mailer.sendEmail(`${createResult.firstName} ${createResult.lastName} <${createResult.email}>`, 'Verify your email', { text: `Click this link to verify your account: ${emailURL}`, html: emailTemplate })
      } catch (err) {
        context.app.logger.error(err);
        reject({ _code: 500, message: 'Internal server error' });
      }

      resolve(createResult);
    })
  }

  private validateEmail = (context: IContext) => {
    return new Promise(async (resolve, reject) => {
      // Check for token
      if (!context.params.token) {
        reject({ _code: 307, redirect: '/login' });
        return;
      }

      const [ userId, token ] = context.params.token.split('_');

      // Check for matching user
      const Users = context.app.services['/users'] as UsersRoute;
      let user: any;
      try {
        const getUserContext = { ...context };
        user = await Users.getById(Object.assign(getUserContext, { params: { id: userId, skipExclusions: true }}));
      } catch (err) {
        context.app.logger.error(err);
        reject({ _code: 500, message: 'Internal Server Error'});
        return;
      }

      if (!user) {
        reject({ _code: 404, message: 'User not found' });
        return;
      }

      // Check if user has auth tokens
      if(!user.auth.emailToken && !user.auth.forgotToken) {
        context.app.logger.log('error', 'Attempt to verify code after user was verified');
        reject({ _code: 400, message: 'Bad Request' });
        return;
      }

      // Check if user is already verified
      if(user.auth.emailVerified) {
        context.app.logger.log('error', 'Attempt to verify code after user was verified');
        reject({ _code: 400, message: 'Bad Request' });
        return;
      }

      // Check for email token
      const now = new Date().valueOf();
      if(user.auth.emailToken) {
        const validToken = user.auth.emailToken === context.params.token;
        const freshToken = user.auth.emailTokenExp ? user.auth.emailTokenExp < now : false;
        if (!validToken || !freshToken) {
          context.app.logger.log('error', 'Invalid email token', { validToken, freshToken });
          reject({ _code: 400, message: 'Bad Request' });
          return;
        }
      }

      // Check for forgot password token if the user is verified
      if(user.auth.forgotToken && user.auth.emailVerified) {
        const validToken = user.auth.forgotToken === context.params.token;
        const freshToken = user.auth.forgotTokenExp ? user.auth.forgotTokenExp < now : false;

        if (!validToken || !freshToken) {
          context.app.logger.log('error', 'Invalid forgot pw token', { validToken, freshToken });
          reject({ _code: 400, message: 'Bad Request' });
          return;
        }
      }

      // Update user
      delete user.auth.emailToken;
      delete user.auth.emailTokenExp;
      delete user.auth.forgotToken;
      delete user.auth.forgotTokenExp;
      user.auth.emailVerified = true;
      user.active = true;

      try {
        const getUserContext = { ...context };
        user = await Users.patch(
          Object.assign(
            getUserContext,
            {
              params: {
                id: userId
              },
              data: {
                active: true,
                auth: user.auth
              }
            }
          ));
      } catch (err) {
        context.app.logger.error(err);
        reject({ _code: 500, message: 'Internal Server Error'});
        return;
      }

      // Redirect
      const redirect = context.query.redirect ? context.query.redirect : '/login';
      resolve({ _code: 301, redirect });
    })
  }

  private forgotPassword = (context: IContext) => {
    return new Promise(async (resolve, reject) => {
      // Reject if email is not setup
      if (!context.app.environment.HAS_EMAIL) {
        context.app.logger.log('warn', 'Unable to send forgot password email - HAS_EMAIL is false');
        reject({ _code: 500, message: 'Internal Server Error'});
        return;
      }

      // Get user with matching email
      const Users = context.app.services['/users'] as UsersRoute;
      let user: any;
      try {
        const getUserContext = Object.assign({ ...context }, { params: { skipExclusions: true } } );
        user = await Users.get(getUserContext);
      } catch (err) {
        context.app.logger.error(err);
        reject({ _code: 500, message: 'Internal Server Error'});
        return;
      }

      // Reject if no user is found
      if (!user) {
        context.app.logger.log('warn', 'No user found', { query: context.query });
        reject({ _code: 404, message: 'User Not Found'});
        return;
      }

      // Reject if user is not verified or inactive
      const _user = { ...user } as User;
      const auth = _user.auth;

      if (!auth.emailVerified || !_user.active ) {
        context.app.logger.log('warn', 'Forgot password attempt on unavilable user');
        reject({ _code: 404, message: 'User Not Found' });
        return;
      }

      // Generate email token & expiration
      const emailToken = context.app.authentication.generateEmailVerificationCode(_user, context, 'forgot');
      const domain = context.app.environment.HOSTNAME;
      const emailURL = `${domain}/auth/validate-email/${emailToken}?redirect=/forgot-pw`;

      const emailTemplate = `
<!DOCTYPE html>
<html>
  <head>
      <meta name="viewport" content="width=device-width">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <title>Email Verification Template</title>
  </head>
  <body style="margin: 0; width: 100vw: height: 100vh;">
  <header style="width: 100%; background-color: #9BC7D5; padding: 0.5rem; font-weight: bold;">Bin Inventory</header>
  <main style="padding: 0.5rem;">
      <p style="font-size: 14px; font-weight: normal;">A reset password request was made to reset the account associated with this email</p>
      <p style="font-size: 14px; font-weight: normal;">If you did, click this link to verify: <a href="${emailURL}">${emailURL}</a></p>
      <p style="font-size: 14px; font-weight: normal;">If you did not attempt to reset your password, please ignore this email.</p>
      <p>Thank You</p>
  </main>
  </body>
</html>`


      // Send email token to user with instructions to click link to start reset password flow
      // http://localhost:6190/auth/validate-email/<token>?redirect=/forgot-password
      try {
        this.mailer.sendEmail(`${_user.firstName} ${_user.lastName} <${_user.email}>`, 'Verify your email', { text: `Click this link to verify your account: ${emailURL}`, html: emailTemplate })
      } catch (err) {
        context.app.logger.error(err);
        reject({ _code: 500, message: 'Internal server error' });
      }

      resolve({ result: true })
    })
  }

  private logout = (context: IContext) => {
    return new Promise(async (resolve, reject) => {
      const noCookieOptions = {
        path: '/',
        maxAge: 0
      };

      context.response.cookie('session-access', '', noCookieOptions);
      context.response.cookie('session-refresh', '', noCookieOptions);

      resolve({ _code: 204 });
    });
  }
}

exports.initialize = (app: Application) => {
  return new AuthRoute(app);
}