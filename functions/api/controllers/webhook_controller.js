const main_control = require('../services/main_control');
const firebase_service = require('../services/firebase_service');

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

// const postWebhook = async (req, res) => {
//   try {
//     const entries = req.body.entry;
//     if (entries && entries.length) {
//       // Process each entry asynchronously
//       const processingEntries = entries.map(async (entry) => {
//         const changes = entry.changes;
//         if (changes && changes.length) {
//           // Process each change asynchronously
//           const processingChanges = changes.map(async (change) => {
//             if (change.value && change.value.messages && change.value.messages.length) {
//               // Process each message asynchronously
//               const processingMessages = change.value.messages.map(async (message) => {
//                 // ToDo: get the phone number of the user who sent the message
//                 const userPhone = message.from;
//                 const message_text = message.text.body;
//                 // Have to check whether this is a duplicate message or not using this ID!
//                 const messageId = message.id;
//                 const current_shop = await firebase_service.get_users_conversation(userPhone);
//                 const message_is_duplicate = await firebase_service.does_message_exist(current_shop, messageId);
//                 if (message_is_duplicate) {
//                   console.log("Duplicate message received, ignoring...");
//                   return;
//                 }
//                 console.log("Received message from", userPhone, ": ", message_text);
//                 await main_control.main_control(userPhone, message_text, messageId);
//                 console.log("SENT MESSAGE");
//               });

//               await Promise.all(processingMessages);
//             }
//           });

//           await Promise.all(processingChanges);
//         }
//       });

//       await Promise.all(processingEntries);
//     }

//     res.status(200).send('EVENT RECEIVED');
//   } catch (error) {
//     console.error("Error in postWebhook:", error);
//     res.status(500).send('Internal Server Error');
//   }
// };

const postWebhook = async (req, res) => {
  try {
    console.log("Received a webhook: ", req.body);
    const entries = req.body.entry;
    if (entries && entries.length) {
      // Process each entry asynchronously
      const processingEntries = entries.map(async (entry) => {
        const changes = entry.changes;
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
              console.log(`Message Template Status Update: ${value.event}`);
              console.log(`Template ID: ${value.message_template_id}, Name: ${value.message_template_name}, Language: ${value.message_template_language}, Reason: ${value.reason}`);
              // Here, add your logic to handle the message template status update
              // This could be logging information, updating a database, etc.
            }
          });

          await Promise.all(processingChanges);
        }
      });

      await Promise.all(processingEntries);
    }

    res.status(200).send('EVENT RECEIVED');
  } catch (error) {
    console.error("Error in postWebhook:", error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {getWebhook, postWebhook};
