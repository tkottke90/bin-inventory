import nodemailer, { Transporter } from 'nodemailer';
import Application from '../classes/application.class';

class MailerClass {

  public mailer: Transporter;

  constructor(app: Application) {
    this.mailer = nodemailer.createTransport({
      host: app.environment.EMAIL_HOST,
      port: app.environment.EMAIL_PORT,
      auth: {
          user: app.environment.EMAIL_UN,
          pass: app.environment.EMAIL_PW
      }
    });

    this
      .mailer
      .verify()
      .then( result => {
        app.logger.log('verbose', 'Mailer service successfully initialized');
        app.environment.HAS_EMAIL = true;
      })
      .catch( error => {
        app.logger.error(error, message => `MailerClass: ${message}`);
        app.environment.HAS_EMAIL = false;
      })
  }

  public sendEmail(recipiant: string, subject: string, content: { text?: string, html?: string } ) {
    if (!content.text && !content.html) {
      throw new Error('Invalid email request - empty email')
    }

    return this.mailer.sendMail({
      from: '"no-reply" <admin@tdkottke.com>',
      to: recipiant,
      subject,
      ...content
    });
  }
}

export default (app: Application) => {
  return new MailerClass(app);
}

export {
  MailerClass
}