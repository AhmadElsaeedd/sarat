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
      'Authorization': `Bearer EAAMxddllNeIBO9dbK9PY5ESUnFjIlJsYbZAiJNdCMyFkF3eipNrtwgsCkaJfmvrBIFBFZBu9hZBPZAF9ju7WpjJQVigD3ZClCqIjZA1S0apflQ8mXzWGkmGiJqUn2EJTT17hZAT7eJZBBRYYLaBANpZBNYXIKdNoWKCRnJjMcZCf2o3oTsfsBryXJJDtyvRabZBEXUdyyPhhGhRZBt6Mt8KTv3IZD`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
};

module.exports = {sendMessage};
