const mailer = require('express-mailer')

class MailServiceProvider {

    constructor(app) {

        mailer.extend(app, {
            from: process.env.MAIL_FROM,
            host: process.env.MAIL_HOST, // hostname
            secureConnection: false, // use SSL
            port: process.env.MAIL_PORT, // port for secure SMTP
            transportMethod: process.env.MAIL_DRIVER, // default is SMTP. Accepts anything that nodemailer accepts
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD,
            },
            tls: {
                ciphers:'SSLv3'
            }
        });

        console.log("Mail server started.")

    }

}


module.exports = (app) => {
    return new MailServiceProvider(app);
}