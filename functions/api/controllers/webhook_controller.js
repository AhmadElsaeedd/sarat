const {getOpenAIResponse} = require('../services/openai_service');
const {sendMessage} = require('../services/whatsapp_service');

const verifyToken = 'testing'; // make this a better password and put it in .env

const getWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
};

const postWebhook = async (req, res) => {
  // this function gets updates from the user (messages basically)
  const entries = req.body.entry;
  if (entries && entries.length) {
    entries.forEach((entry) => {
      const changes = entry.changes;
      if (changes && changes.length) {
        changes.forEach((change) => {
          if (change.value && change.value.messages && change.value.messages.length) {
            change.value.messages.forEach(async (message) => {
              // ToDo: get the phone number of the user who sent the message
              const userPhone = message.from;
              console.log("I RECEIVED A MESSAGE FROM: ", userPhone);
              console.log('Received message:', message.text.body);
              // give the message to the openai service to generate a response
              const aiResponse = await getOpenAIResponse(userPhone, message.text.body);
              console.log("OPENAI's response is: ", aiResponse);
              // ToDo: pass this response to the whatsapp function that sends a message back to the user
              await sendMessage(userPhone, aiResponse);
            });
          }
        });
      }
    });
  }

  res.status(200).send('EVENT_RECEIVED');
};

module.exports = {getWebhook, postWebhook};
