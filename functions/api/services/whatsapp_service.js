const axios = require('axios');

const sendMessage = async (recipientPhone, messageContent) => {
  try {
    const url = 'https://graph.facebook.com/v18.0/147069021834152/messages';
    const data = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      text: {
        body: messageContent,
      },
    };
    const headers = {
      'Authorization': `Bearer EAAMxddllNeIBOy7FNFFOAADUxvVfg2Uf9g97IxzIcv32keCAV8ipDlaMdNZCMtEnmpWQrCE67oeHyjcR7onNAdpV6C6LFaJZAZCxFuXoUQ2g4RsirtiMDWB2lxx3oXvjRefZANysF2DwytQn1ETvYSbZBihYvWCFsZArvqnqaZAzN8ZB8MP07nKBsvpr4uYXRgAxATpZC1qaDhk51jVlVBXwZD`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
};

module.exports = {sendMessage};
