const stripe_service = require('../services/stripe_service');
const firebase_service = require('../services/firebase_service');
const axios = require('axios');

const Whatsapp_Authorization = "EAAMxddllNeIBO8uQoPF4ZBq5coj2qOVwexqBj6XbOGz2qsvwzz4KLZCQmt0razPULJEoU7GW0pQcZC2QWhkrZBX7Bq1zQeRHR4nFPwIw1aQh7MmiCZA5XtunBYwwOWk0V091mCb3R6UWKe1ATKedDQEi6ZBEOwylYRQnRgO4eVktxKjiwSh3ZBpikvjPhuhlkZBrXxQ5CjZBtN0vxu3G5ZBp0ZD";
const Whatsapp_URL = "https://graph.facebook.com/v18.0/147069021834152/messages";
const Whatsapp_headers = {
  'Authorization': `Bearer ${Whatsapp_Authorization}`, // Replace with your actual access token
  'Content-Type': 'application/json',
};

async function unifiedSendMessage(recipientPhone, messageContent = null,
    productName = null, personName = null, productSize= null,
    paymentURL = null, refund_status = null,
    payment_status = null, payment_method_id = null, message_type = null) {
  try {
    const shop = await firebase_service.get_users_conversation(recipientPhone);
    const messageTemplate = await firebase_service.get_message_template(shop, message_type);
    messageContent = await getMessageContent(message_type, messageContent, productName, personName, productSize, paymentURL, refund_status, payment_status, payment_method_id, messageTemplate, shop);
    const data = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      text: {
        body: messageContent,
      },
    };
    await firebase_service.increment_total_messages(shop);
    const response = await axios.post(Whatsapp_URL, data, {headers: Whatsapp_headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
}

async function getMessageContent(message_type, messageContent, productName, personName, productSize, paymentURL, refund_status, payment_status, payment_method_id, messageTemplate, shop) {
  console.log("message type is: ", message_type);
  switch (message_type) {
    case 'abandoned_cart_message':
    {
      await firebase_service.increment_number_of_conversations(shop);
      return create_greeting_message(productName, personName, productSize, messageTemplate);
    }
    case 'payment_link_message': {
      return create_payment_link_message(paymentURL, messageTemplate);
    }
    case 'payment_confirmation_message': {
      const payment_details = await stripe_service.get_card_details(payment_method_id);
      return create_confirmation_message(payment_details, messageTemplate);
    }
    case 'success_message': {
      return create_success_message(payment_status, messageTemplate);
    }
    case 'refund_message': {
      return create_refund_message(refund_status, messageTemplate);
    }
    case 'failed_refund':
      return "Failed to refund.";
    default:
      return messageContent;
  }
}

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

function create_greeting_message(productName, personName = null, productSize = null, messageTemplate) {
  const message = messageTemplate
      .replace('{personName}', personName ? ' '+ personName : ',')
      .replace('{productName}', productName)
      .replace('{productSize}', productSize ? 'in ' + productSize : '');
  console.log("message is: ", message);
  return message;
}

function create_payment_link_message(paymentURL, message_template) {
  const message = message_template.replace('{paymentURL}', paymentURL);
  return message;
}

function create_confirmation_message(card_details, message_template) {
  const brand = card_details.card.brand;
  const capitalizedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
  const last4 = card_details.card.last4;
  const message = message_template
      .replace('{brand}', capitalizedBrand)
      .replace('{last4}', last4);
  return message;
}

function create_success_message(payment_status, message_template) {
  const capitalizedStatus = payment_status.charAt(0).toUpperCase() + payment_status.slice(1);
  const message = message_template.replace('{payment_status}', capitalizedStatus);
  return message;
}

function create_refund_message(refund_status, message_template) {
  const capitalizedStatus = refund_status.charAt(0).toUpperCase() + refund_status.slice(1);
  const message = message_template.replace('{refund_status}', capitalizedStatus);
  return message;
}

module.exports = {sendMessage, unifiedSendMessage};
