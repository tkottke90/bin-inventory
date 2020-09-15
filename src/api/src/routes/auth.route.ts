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
      { method: 'get', path: '/get-user', action: this.getIDToken, beforeHooks: [ app.authentication.jwtAuth ] },
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

      // Check if user is already verified
      if(user.auth.emailVerified) {
        context.app.logger.log('error', 'Attempt to verify code after user was verified');
        reject({ _code: 400, message: 'Bad Request' });
        return;
      }

      // Check if tokens match
      if(user.auth.emailToken !== context.params.token) {
        context.app.logger.log('error', 'Invalid email token');
        reject({ _code: 400, message: 'Bad Request' });
        return;
      }

      // Update user
      delete user.auth.emailToken;
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
      resolve({ _code: 301, redirect: '/login' });
    })
  }

}

exports.initialize = (app: Application) => {
  return new AuthRoute(app);
}