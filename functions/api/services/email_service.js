const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'textlet.io@gmail.com', // Your Gmail address
    pass: 'tykhmrsbduoxxecb', // Your app password
  },
});

const emailService = {
  sendEmail: async (to, subject, text) => {
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"Ahmads code" <textlet.io@gmail.com>', // Sender address
      to: to, // List of receivers
      subject: subject, // Subject line
      text: text, // Plain text body
    });

    console.log('Message sent: %s', info.messageId);
  },
};

module.exports = emailService;
