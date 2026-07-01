const nodemailer = require('nodemailer')

const sendEmail = async (option) => {
    
    var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "c98a456b20b8d5",
    pass: "bd3a731d7b4fb3"
  }
});

    const mailOption = {
        from:'kiaghasemi@gmail.com',
        to:option.email,
        subject:option.subject,
        html:option.html
    }

    await transport.sendMail(mailOption)

}

module.exports = sendEmail