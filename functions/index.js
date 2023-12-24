const functions = require('firebase-functions');
const app = require('./api/app');

exports.webhook = functions.https.onRequest(app);
