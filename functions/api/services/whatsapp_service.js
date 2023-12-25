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
      'Authorization': `Bearer EAAMxddllNeIBO2R7pqlr4iiGFR85howY3tEhzUHe7IAZCFekf9BctCtTCnHyRAV86M2felIs3mm6jYEuz0ds6ZAwSAHC3d9iSS8Qg2IDSIfWX9QNtGtDzHDsoQ7ho0ZBXu6mColHpQpuIN4CdK09IcZAmzNZAPHt7XugvHRdZBxR5tWyTRZBOJtH3EipoDCDqXAulMqYymGEPhr6Su1XOQZD`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
};

module.exports = {sendMessage};
