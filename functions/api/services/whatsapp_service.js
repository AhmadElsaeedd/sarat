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
      'Authorization': `Bearer EAAMxddllNeIBO6VgtAANjuQ9FGMGTvtyyyonrxGwjaBZCU0NPwESXazfA0AZClep0nteeZB9CzYx4af08GWAJmoFEZCl5b0QaBdja9z72m7Em06b8drgJFkfVHJqgMcynZCG5BS4fY1f2uUNoxTDvDjRiTyYa8pdjSt5hmhVgDzLxZCtwniwbRw6FNp2ZCXrSNlzj6EkulmDlDqhZC2tjLMZD`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
};

module.exports = {sendMessage};
