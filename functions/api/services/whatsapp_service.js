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
      'Authorization': `Bearer EAAMxddllNeIBO9p1gQLEveDfI3REPeeZCfK9XMtEx6tAD4dwZBTrWDOoo5JDVTMahobUUBi38wNdNxWpVdPM2pF7j2nLZC3IZA8yhNbVchso3Tn9kH1pKc2X1gX0VV4NCwpMM31k55jU5fn2xWxUeePZAGZCUourSajdalnwiB0EYkiNp4LuZAZCZAhi7yiFZBLivG4ZAHJf0Y2UyFZBLJiQPN4ZD`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
};

function create_greeting_message(productName, personName = null, productSize = null) {
  const message = `Hey${personName ? ' '+ personName + ',' : ','} ${productName} ${productSize ? 'in ' + productSize : ''} you loved is back! Text 'Yes' to claim yours. Fast, fabulous fashion is just a message away!`;
  return message;
}

const sendIntroMessage = async (recipientPhone, productName, personName = null, productSize= null) => {
  try {
    const messageContent = create_greeting_message(productName, personName, productSize);
    const url = 'https://graph.facebook.com/v18.0/147069021834152/messages';
    const data = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      text: {
        body: messageContent,
      },
    };
    const headers = {
      'Authorization': `Bearer EAAMxddllNeIBO9p1gQLEveDfI3REPeeZCfK9XMtEx6tAD4dwZBTrWDOoo5JDVTMahobUUBi38wNdNxWpVdPM2pF7j2nLZC3IZA8yhNbVchso3Tn9kH1pKc2X1gX0VV4NCwpMM31k55jU5fn2xWxUeePZAGZCUourSajdalnwiB0EYkiNp4LuZAZCZAhi7yiFZBLivG4ZAHJf0Y2UyFZBLJiQPN4ZD`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
};

function create_payment_link_message(paymentURL) {
  const message = `Awesome! go here to complete your payment ${paymentURL}!`;
  return message;
}

const sendPaymentLinkMessage = async (recipientPhone, paymentURL) => {
  try {
    const messageContent = create_payment_link_message(paymentURL);
    const url = 'https://graph.facebook.com/v18.0/147069021834152/messages';
    const data = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      text: {
        // preview_url: true,
        body: messageContent,
      },
    };
    const headers = {
      'Authorization': `Bearer EAAMxddllNeIBO9p1gQLEveDfI3REPeeZCfK9XMtEx6tAD4dwZBTrWDOoo5JDVTMahobUUBi38wNdNxWpVdPM2pF7j2nLZC3IZA8yhNbVchso3Tn9kH1pKc2X1gX0VV4NCwpMM31k55jU5fn2xWxUeePZAGZCUourSajdalnwiB0EYkiNp4LuZAZCZAhi7yiFZBLivG4ZAHJf0Y2UyFZBLJiQPN4ZD`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
};

module.exports = {sendMessage, sendIntroMessage, sendPaymentLinkMessage};
