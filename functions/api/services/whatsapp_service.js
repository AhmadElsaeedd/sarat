const stripe_service = require('../services/stripe_service');
const firebase_service = require('../services/firebase_service');
const axios = require('axios');

// const Whatsapp_Authorization = "EAAMxddllNeIBO3U2WSqY2nSC74rUz0l3ODjY7XEJdv6SenJAqkjzvC8WvRT5yob1eUj8z62oWOjAib7hkhGmoiMtJYTpw2hXIuHKkzDuf7cKrTlDJZCmNxj7cypvCDZAB1nBDaUssm2FMbSTkRZAq7BZASOR0zeZBguxCozgIIc3EZCdScYrZCKcSZCBHAuzNtIaMSkdZCGLgs3W99NpXUe4ZD";
// const Whatsapp_URL = "https://graph.facebook.com/v18.0/147069021834152/messages";
// const Whatsapp_headers = {
//   'Authorization': `Bearer ${Whatsapp_Authorization}`, // Replace with your actual access token
//   'Content-Type': 'application/json',
// };

async function sendMessage(recipientPhone, productImage = null, messageContent = null,
    productName = null, personName = null, productSize= null,
    paymentURL = null, refund_status = null,
    payment_status = null, payment_method_id = null, message_type = null) {
  try {
    // Here use the product image url to send the message to the customer
    const shop = await firebase_service.get_users_conversation(recipientPhone);
    const keys = await firebase_service.get_whatsapp_keys(shop);
    const Whatsapp_URL = `https://graph.facebook.com/v18.0/${keys.whatsapp_phone_number_id}/messages`;
    const Whatsapp_headers = {
      'Authorization': `Bearer ${keys.whatsapp_access_token}`,
      'Content-Type': 'application/json',
    };
    const messageTemplate = await firebase_service.get_message_template(shop, message_type);
    messageContent = await getMessageContent(recipientPhone, message_type, messageContent, productName, personName, productSize, paymentURL, refund_status, payment_status, payment_method_id, messageTemplate, shop);
    let data;
    if (productImage != null) {
      // send a message with a picture of the product
      data = {
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'image',
        image: {
          link: productImage,
          caption: messageContent,
        },
      };
    } else {
      data = {
        messaging_product: 'whatsapp',
        to: recipientPhone,
        text: {
          body: messageContent,
        },
      };
    }
    // await firebase_service.increment_total_messages(shop);
    await firebase_service.increment_messages(shop, "You", recipientPhone, messageContent);
    const response = await axios.post(Whatsapp_URL, data, {headers: Whatsapp_headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
}

async function getMessageContent(recipientPhone, message_type, messageContent, productName, personName, productSize, paymentURL, refund_status, payment_status, payment_method_id, messageTemplate, shop) {
  switch (message_type) {
    case 'abandoned_cart_message':
    {
      // await firebase_service.increment_number_of_conversations(shop);
      await firebase_service.increment_conversations(shop, recipientPhone);
      return create_greeting_message(productName, personName, productSize, messageTemplate);
    }
    case 'refill_message':
    {
      // await firebase_service.increment_number_of_conversations(shop);
      await firebase_service.increment_conversations(shop, recipientPhone);
      return create_refill_message(productName, personName, messageTemplate);
    }
    case 'payment_link_message': {
      await firebase_service.update_conversation_status(shop, recipientPhone, "Payment Pending");
      return create_payment_link_message(paymentURL, messageTemplate);
    }
    case 'payment_confirmation_message': {
      await firebase_service.update_conversation_status(shop, recipientPhone, "Payment Pending");
      const payment_details = await stripe_service.get_card_details(payment_method_id);
      return create_confirmation_message(payment_details, messageTemplate);
    }
    case 'success_message': {
      await firebase_service.update_conversation_status(shop, recipientPhone, "Successful Payment");
      return create_success_message(payment_status, messageTemplate);
    }
    case 'refund_message': {
      await firebase_service.update_conversation_status(shop, recipientPhone, "Refunded");
      return create_refund_message(refund_status, messageTemplate);
    }
    case 'failed_refund':
      return "Failed to refund.";
    default:
      return messageContent;
  }
}

function create_greeting_message(productName, personName = null, productSize = null, messageTemplate) {
  const message = messageTemplate
      .replace('{personName}', personName ? ' '+ personName : ',')
      .replace('{productName}', productName)
      .replace('{productSize}', productSize ? 'in ' + productSize : '');
  return message;
}

function create_refill_message(productName, personName = null, messageTemplate) {
  const message = messageTemplate
      .replace('{personName}', personName ? ' '+ personName : '')
      .replace('{productName}', productName);
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

module.exports = {sendMessage};
