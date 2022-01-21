require('dotenv').config();
const fs = require('fs');
const hbs = require('handlebars')

const mailgun = require('mailgun-js')({ apiKey: process.env.API_KEY, domain: process.env.DOMAIN, host: "api.eu.mailgun.net", });
const TEMPLATE_PATH = fs.readFileSync(__dirname + "/template.html", "utf8");
const sendMail = (email, order_id) => {
    htmlToSend = hbs.compile(TEMPLATE_PATH)
    let data = {
        from: 'NITCMUN<noreply@ipfnitc.com>',
        to: email.trim(),
        subject: "NITCMUN | Registeration",
        html: htmlToSend({ order_id })
    }
    mailgun.messages().send(data, (err, body) => {
        if (err) {
            console.log("something went wrong", err)
        } else {
            console.log(`mail sent to ${email}`)
        }
    })
}
module.exports = sendMail