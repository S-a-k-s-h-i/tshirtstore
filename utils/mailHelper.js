const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  const message = {
    from: "sakshi.pokhria@crownstack.com",
    to: options.toEmail,
    subject: options.subject,
    text: options.message,
  };
  // send mail with defined transport object
  await transporter.sendMail(message);
};

module.exports = sendMail;
