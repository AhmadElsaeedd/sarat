const stripe_service = require('../services/stripe_service');
const firebase_service = require('../services/firebase_service');
const axios = require('axios');

const Whatsapp_Authorization = "EAAMxddllNeIBOyQLzm5hOd70yl4hOQUTwoMA7W3tvjB2jdZAL8ZCbt4bOZBt81l1fDTpBmKZCfebMJyNmUy1SgITdsM4d0xfGhN0ACjdMEAfm4x3TNclAr9h70dW65HqS0UYWpFeNDAGaIfq98FDeoPWPvdI6ZCoGshVlXaAYZBymZBcX838ATnKwS2O1LOmh9aVEE9cxLvdulFla7JOK0ZD";


async function unifiedSendMessage(recipientPhone, messageContent = null,
    productName = null, personName = null, productSize= null,
    paymentURL = null, refund_status = null,
    payment_status = null, payment_method_id = null, message_type = null) {
  try {
    const shop = await firebase_service.get_users_conversation(recipientPhone);
    const url = 'https://graph.facebook.com/v18.0/147069021834152/messages';
    const headers = {
      'Authorization': `Bearer ${Whatsapp_Authorization}`, // Replace with your actual access token
      'Content-Type': 'application/json',
    };
    const messageTemplate = await firebase_service.get_message_template(shop, message_type);
    switch (message_type) {
      case 'abandoned_cart_message': {
        // handle the case where it is an abandoned cart message
        messageContent = create_greeting_message(productName, personName, productSize, messageTemplate);
        await firebase_service.increment_number_of_conversations(shop);
        break;
      }
      // Add the case for the restocking!
      case 'payment_link_message': {
        messageContent = create_payment_link_message(paymentURL, messageTemplate);
        break;
      }
      case 'payment_confirmation_message': {
        const payment_details = await stripe_service.get_card_details(payment_method_id);
        messageContent = create_confirmation_message(payment_details, messageTemplate);
        break;
      }
      case 'success_message': {
        messageContent = create_success_message(payment_status, messageTemplate);
        break;
      }
      case 'refund_message': {
        messageContent = create_refund_message(refund_status, messageTemplate);
        break;
      }
      case 'failed_refund': {
        messageContent = "Failed to refund.";
        break;
      }
      default: {
        // this is the ai message and messageContent is already defined in the function call
        break;
      }
    }
    const data = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      text: {
        body: messageContent,
      },
    };
    await firebase_service.increment_total_messages(shop);
    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
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
  // Check later whether I need ternary operators here or what to make the template replacable
  // const message = `Hey${personName ? ' '+ personName + ',' : ','} ${productName} ${productSize ? 'in ' + productSize : ''} you loved is back! Text 'Yes' to claim yours. Fast, fabulous fashion is just a message away!`;
  const message = messageTemplate;
  return message;
}

async function sendIntroMessage(recipientPhone, productName, personName = null, productSize= null, shop) {
  try {
    const messageTemplate = await firebase_service.get_message_template(shop, "restock_message");
    const messageContent = create_greeting_message(productName, personName, productSize, messageTemplate);
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
    await firebase_service.increment_total_messages(shop);
    await firebase_service.increment_number_of_conversations(shop);
    const response = await axios.post(url, data, {headers: headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
}

function create_payment_link_message(paymentURL, message_template) {
  // const message = `Awesome! go here to complete your payment ${paymentURL}!`;
  const message = message_template;
  return message;
}

async function sendPaymentLinkMessage(recipientPhone, paymentURL) {
  try {
    const shop = await firebase_service.get_users_conversation(recipientPhone);
    const messageTemplate = await firebase_service.get_message_template(shop, "payment_link_message");
    const messageContent = create_payment_link_message(paymentURL, messageTemplate);
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

function create_confirmation_message(card_details, message_template) {
  // const brand = card_details.card.brand;
  // const capitalizedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
  // const last4 = card_details.card.last4;
  // const message = `Awesome! Are you sure you want to pay with your ${capitalizedBrand} card ending with ${last4}? Say 'Yes' to confirm. You will be able to cancel in the next 24 hours.`;
  const message = message_template;
  return message;
}

async function sendConfirmationMessage(recipientPhone, payment_method_id) {
  try {
    const shop = await firebase_service.get_users_conversation(recipientPhone);
    const messageTemplate = await firebase_service.get_message_template(shop, "payment_link_message");
    const payment_details = await stripe_service.get_card_details(payment_method_id);
    const messageContent = create_confirmation_message(payment_details, messageTemplate);
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

function create_success_message(payment_status, message_template) {
  // const capitalizedStatus = payment_status.charAt(0).toUpperCase() + payment_status.slice(1);
  // const message = `${capitalizedStatus}! Text us 'Cancel' to cancel, only in the next 24 hours.`;
  const message = message_template;
  return message;
}

async function sendSuccessMessage(recipientPhone, payment_status) {
  try {
    const shop = await firebase_service.get_users_conversation(recipientPhone);
    const messageTemplate = await firebase_service.get_message_template(shop, "success_message");
    const messageContent = create_success_message(payment_status, messageTemplate);
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

function create_refund_message(refund_status, message_template) {
  // const capitalizedStatus = refund_status.charAt(0).toUpperCase() + refund_status.slice(1);
  // const message = `${capitalizedStatus}. Your payment has been canceled and the amount will be refunded to your card.`;
  const message = message_template;
  return message;
}

async function sendRefundMessage(recipientPhone, refund_status) {
  try {
    const shop = await firebase_service.get_users_conversation(recipientPhone);
    const messageTemplate = await firebase_service.get_message_template(shop, "refund_message");
    const messageContent = create_refund_message(refund_status, messageTemplate);
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

module.exports = {sendMessage, sendIntroMessage, sendPaymentLinkMessage, sendConfirmationMessage, sendSuccessMessage, sendRefundMessage, sendFailureMessage, unifiedSendMessage};
