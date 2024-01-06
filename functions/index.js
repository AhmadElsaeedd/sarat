const functions = require('firebase-functions');
const app = require('./api/app');
require('events').EventEmitter.defaultMaxListeners = 20;

exports.webhook = functions.https.onRequest(app);
