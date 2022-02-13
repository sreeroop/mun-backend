const fs = require('fs');
const csv = require('csv-parser')
const admin = require('firebase-admin')
const dotenv = require('dotenv').config()
const FieldValue = require('firebase-admin').firestore.FieldValue;
admin.initializeApp({
    credential: admin.credential.cert({
        "type": process.env.TYPE.trim(),
        "project_id": process.env.PROJECT_ID.trim(),
        "private_key_id": process.env.PROJECT_KEY_ID.trim(),
        "private_key": process.env.PRIVATE_KEY.replace(/\\n/g, '\n').trim(),
        "client_email": process.env.CLIENT_EMAIL.trim(),
        "client_id": process.env.CLIENT_ID.trim(),
        "auth_uri": process.env.AUTH_URI.trim(),
        "token_uri": process.env.TOKEN_URI.trim(),
        "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_CERT_URL.trim(),
        "client_x509_cert_url": process.env.CLIENT_CERT_URL.trim()
    })
});
//template from templates folder
//csv from data folder
const CSV_PATH = "/home/sree/ipf/mun-backend/helpers/data/total.csv"


const addtoDB = async (uuid, link) => {
    await admin.firestore().collection("certificates").doc(uuid).set({
        urls: FieldValue.arrayUnion(link)
    }, { merge: true }).then(() => {
        console.log("success");
    }).catch(() => {
        console.log("fail");
    })

}

fs.createReadStream(CSV_PATH)
    .pipe(csv())
    .on('data', (row) => {
        const { email, uuid, link } = row;
        addtoDB(uuid, link)
        console.log("data iteration")
    })
    .on('end', () => {
        console.log("end")
    })