const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        'to': email,
        'from': 'andres.quijano.a@gmail.com',
        'subject': 'Welcome',
        'text': `Hi ${name}, welcome to the app.`
    });
};

const sendGoodbyeEmail = (email, name)=>{
    sgMail.send({
        'to': email,
        'from': 'andres.quijano.a@gmail.com',
        'subject': 'Goodbye',
        'text': `Hi ${name}, I hope you'll be back soon.`
    });
};

module.exports = {
    sendWelcomeEmail,
    sendGoodbyeEmail
};