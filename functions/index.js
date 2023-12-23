const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');

const app = express();

// Your verify token should be a complex, unguessable string.
const verifyToken = 'testing';

app.use(cors({origin: true}));

// Adds support for GET requests to our webhook
app.get('/', (req, res) => {
  console.log("I am in the get request");
  //   res.send('Hello from Firebase ahmad is here!');
  // Parse the query params
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === verifyToken) {
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

app.post('/', (req, res) => {
//   console.log('Received webhook:', JSON.stringify(req.body, null, 2)); // More detailed log

  // Assuming the message content is in the first 'entry' and 'changes'
  const entries = req.body.entry;
  if (entries && entries.length) {
    entries.forEach((entry) => {
      const changes = entry.changes;
      if (changes && changes.length) {
        changes.forEach((change) => {
          // Log the entire change object or drill down to message specifics
        //   console.log('Received change:', JSON.stringify(change, null, 2));

          // If you know the structure of your messages, you can log specific fields
          // For example, if your message text is in the 'value' property:
          if (change.value && change.value.messages && change.value.messages.length) {
            change.value.messages.forEach((message) => {
              console.log('Received message:', message.text.body);
            });
          }
        });
      }
    });
  }

  res.status(200).send('EVENT_RECEIVED');
});


exports.webhook = functions.https.onRequest(app);

