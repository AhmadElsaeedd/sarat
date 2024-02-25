const main_control = require('../services/main_control');
const firebase_service = require('../services/firebase_service');
const crypto = require('crypto');

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

// // Function to load the public key
function loadPublicKey(publicKeyString) {
  // If your key has headers and footers, you can trim them out here
  publicKeyString = publicKeyString.replace('-----BEGIN RSA PUBLIC KEY-----\n', '').replace('\n-----END RSA PUBLIC KEY-----', '');
  // Convert base64 string to buffer
  const publicKeyBuffer = Buffer.from(publicKeyString, 'base64');
  // Create a public key object from the buffer
  return crypto.createPublicKey({
    key: publicKeyBuffer,
    format: 'der',
    type: 'spki',
  });
}

// Function to verify the signature
function verifySignature(plainText, signature, publicKey) {
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(plainText, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'base64');
  return verifier.verify(publicKey, signatureBuffer);
}

const postWebhook = async (req, res) => {
  try {
    console.log("Received a webhook: ", req.body);
    const signature = req.headers['x-freshchat-signature'];
    if (!signature) {
      // Now do something specific for messages that are coming from the freshchat webhook
      const entries = req.body.entry;
      if (entries && entries.length) {
      // Process each entry asynchronously
        const processingEntries = entries.map(async (entry) => {
          const changes = entry.changes;
          const wabaId = entry.id;
          if (changes && changes.length) {
          // Process each change asynchronously
            const processingChanges = changes.map(async (change) => {
            // Check for message events and process them
              if (change.value && change.value.messages && change.value.messages.length) {
                const processingMessages = change.value.messages.map(async (message) => {
                  const userPhone = message.from;
                  const message_text = message.text.body;
                  const messageId = message.id;
                  const current_shop = await firebase_service.get_users_conversation(userPhone);
                  const message_is_duplicate = await firebase_service.does_message_exist(current_shop, messageId);
                  if (message_is_duplicate) {
                    console.log("Duplicate message received, ignoring...");
                    return;
                  }
                  console.log("Received message from", userPhone, ": ", message_text);
                  await main_control.main_control(userPhone, message_text, messageId);
                  console.log("SENT MESSAGE");
                });

                await Promise.all(processingMessages);
              } else if (change.field === "message_template_status_update") {
              // Specific check for message_template_status_update events
                const value = change.value;
                console.log("WABA ID: ", wabaId);
                console.log(`Message Template Status Update: ${value.event}`);
                console.log(`Template ID: ${value.message_template_id}, Name: ${value.message_template_name}, Language: ${value.message_template_language}, Reason: ${value.reason}`);
                await firebase_service.update_message_template_status(wabaId, value.message_template_name, value.event);
              // Here, add your logic to handle the message template status update
              // This could be logging information, updating a database, etc.
              }
            });

            await Promise.all(processingChanges);
          }
        });

        await Promise.all(processingEntries);
      }
    } else {
      // Assuming the payload is the raw body of the request
      const payload = JSON.stringify(req.body);
      const publicKeyString = `-----BEGIN RSA PUBLIC KEY-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmvLYMvjN82m5fArfNa23ti3wK76YxBq4YIALWwupTVXJ1EcGZVxBtzc92966PkfMI89h9scD0yAMu1wwN4sL/pkh4wMSeDMC5dC3TyKRXEXqgAFid799+Qy9FnfoeyLazphwtqCDM4ZXQJzlz++SiHvO7OrETOvz1FI74YEJlWvcjZUA3+SRE/L/1QCtjLUXRcXMEb8wHTvy6I3SsD3RjloRsUu1uVULf375wdiVD5Tdyx7KaButV64usVsQQts7RbaqsGE9c+k3lQSlozLT3XyqzTWYgYSrJhJo9bVGsW7LBPmSKky8Z34LeukhuS/9SU1XWB6lJlbZCXCrhCJTfQIDAQAB
      -----END RSA PUBLIC KEY-----`;

      // Load the public key
      const publicKey = loadPublicKey(publicKeyString);

      // Verify the signature
      const isVerified = verifySignature(payload, signature, publicKey);

      if (isVerified) {
        console.log('Signature is valid. Message is from Freshchat.');
      // Continue processing the webhook
      } else {
        console.log('Invalid signature. This message may not be from Freshchat.');
        return res.status(401).send('Unauthorized');
      }
    }

    res.status(200).send('EVENT RECEIVED');
  } catch (error) {
    console.error("Error in postWebhook:", error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {getWebhook, postWebhook};
