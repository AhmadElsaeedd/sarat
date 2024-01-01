const stripe_service = require('../services/stripe_service');
const axios = require('axios');

const Whatsapp_Authorization = "EAAMxddllNeIBO7pKBaRFFYiolVAiblP9pWibKMHmujcEIkltSptZCANuzQRnE6ZAEhyfoDSxpK6qf9LJvaZBaxTZACTYw1ngW29NkGfZC8OroHEAswNlZBZCZAPJhIrU8b8T1hvckLZBrYN1FwnmdqUIJZB3iX95WGLWwuZADsSS3wzS33BqwySK7poREkxL3eBumBuFZAgZC1utWakBZAIoZCZCSwQZD";


async function sendMessage(recipientPhone, messageContent) {
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
      'Authorization': `Bearer ${Whatsapp_Authorization}`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
}

function create_greeting_message(productName, personName = null, productSize = null) {
  const message = `Hey${personName ? ' '+ personName + ',' : ','} ${productName} ${productSize ? 'in ' + productSize : ''} you loved is back! Text 'Yes' to claim yours. Fast, fabulous fashion is just a message away!`;
  return message;
}

async function sendIntroMessage(recipientPhone, productName, personName = null, productSize= null) {
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
      'Authorization': `Bearer ${Whatsapp_Authorization}`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
}

function create_payment_link_message(paymentURL) {
  const message = `Awesome! go here to complete your payment ${paymentURL}!`;
  return message;
}

async function sendPaymentLinkMessage(recipientPhone, paymentURL) {
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
      'Authorization': `Bearer ${Whatsapp_Authorization}`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
}

function create_confirmation_message(card_details) {
  const brand = card_details.card.brand;
  const capitalizedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
  const last4 = card_details.card.last4;
  const message = `Awesome! Are you sure you want to pay with your ${capitalizedBrand} card ending with ${last4}? Say 'Yes' to confirm. You will be able to cancel in the next 24 hours.`;
  return message;
}

async function sendConfirmationMessage(recipientPhone, payment_method_id) {
  try {
    const payment_details = await stripe_service.get_card_details(payment_method_id);
    // const messageContent = create_payment_link_message(paymentURL);
    const messageContent = create_confirmation_message(payment_details);
    // const payment_method_object = await get_card_details(payment_method_id);
    // console.log("Payment method object: ", payment_method_object);
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
      'Authorization': `Bearer ${Whatsapp_Authorization}`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
}

function create_success_message(payment_status) {
  const capitalizedStatus = payment_status.charAt(0).toUpperCase() + payment_status.slice(1);
  const message = `${capitalizedStatus}! Text us 'Cancel' to cancel, only in the next 24 hours.`;
  return message;
}

async function sendSuccessMessage(recipientPhone, payment_status) {
  try {
    const messageContent = create_success_message(payment_status);
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
      'Authorization': `Bearer ${Whatsapp_Authorization}`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
}

function create_refund_message(refund_status) {
  const capitalizedStatus = refund_status.charAt(0).toUpperCase() + refund_status.slice(1);
  const message = `${capitalizedStatus}. Your payment has been canceled and the amount will be refunded to your card.`;
  return message;
}

async function sendRefundMessage(recipientPhone, refund_status) {
  try {
    const messageContent = create_refund_message(refund_status);
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
      'Authorization': `Bearer ${Whatsapp_Authorization}`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
}

async function sendFailureMessage(recipientPhone) {
  try {
    const messageContent = "Failed to refund.";
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
      'Authorization': `Bearer ${Whatsapp_Authorization}`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
}

module.exports = {sendMessage, sendIntroMessage, sendPaymentLinkMessage, sendConfirmationMessage, sendSuccessMessage, sendRefundMessage, sendFailureMessage};
