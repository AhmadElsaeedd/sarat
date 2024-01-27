const admin = require('firebase-admin');
const serviceAccount = require('./firebase_key.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

