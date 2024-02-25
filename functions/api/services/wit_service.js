const axios = require('axios');
// const {Wit, log} = require('node-wit');

// const client = new Wit({
//   accessToken: 'VXKCGG6FM52I2EOOD6CQK22X532RYYOJ',
//   logger: new log.Logger(log.DEBUG),
// });

const TOKEN = 'VXKCGG6FM52I2EOOD6CQK22X532RYYOJ';

async function get_message_meaning(message) {
  const encodedMessage = encodeURIComponent(message);
  const url = `https://api.wit.ai/message?v=20230215&q=${encodedMessage}`;

  try {
    const response = await axios.get(url, {
      headers: {'Authorization': `Bearer ${TOKEN}`},
    });
    let intent_object = {};
    if (response.data.intents.length === 0) {
      // in the case that the message is out of scope
      intent_object.name = "out_of_scope";
    } else {
      intent_object = response.data.intents[0];
      console.log("Intent of message is: ", intent_object.name, " with confidence: ", intent_object.confidence * 100);
    }
    return intent_object.name;
  } catch (error) {
    console.error(error);
    throw error; // Rethrow the error to handle it outside this function if needed
  }
}

module.exports = {get_message_meaning};
