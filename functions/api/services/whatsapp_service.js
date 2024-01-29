const stripe_service = require('../services/stripe_service');
const firebase_service = require('../services/firebase_service');
const axios = require('axios');

function first_or_second_reminder(cohort, last_text, checkout_started_at) {
  // Parse the created_at date string into a Date object
  const checkoutStartedAt = new Date(checkout_started_at);
  // const lastTexted = new Date(last_text.timestamp);
  // const lastTexted = last_text.timestamp.toDate();
  const now = new Date();
  // const diffInMillisecondsBtwLastTimeTexted = now - lastTexted;
  const diffInMillisecondsBtwCheckoutStart = now - checkoutStartedAt;
  // Convert the difference to hours
  // const diffInHoursBtwLastTimeTexted = diffInMillisecondsBtwLastTimeTexted / 1000 / 60 / 60;
  const diffInHoursBtwCheckoutStart = diffInMillisecondsBtwCheckoutStart / 1000 / 60 / 60;


  // if (cohort.second_reminder_active && diffInHoursBtwLastTimeTexted > 24 && diffInHoursBtwCheckoutStart > cohort.second_reminder_time) {
  //   return "2";
  // } else if (cohort.first_reminder_active && diffInHoursBtwLastTimeTexted > 24 && diffInHoursBtwCheckoutStart > cohort.first_reminder_time) {
  //   return "1";
  // }

  if (cohort.second_reminder_active && diffInHoursBtwCheckoutStart > cohort.second_reminder_time) {
    return "2";
  } else if (cohort.first_reminder_active && diffInHoursBtwCheckoutStart > cohort.first_reminder_time) {
    return "1";
  }

  return null;
}

function first_or_second_reminder_without_last_text(cohort, checkout_started_at) {
  // Parse the created_at date string into a Date object
  const checkoutStartedAt = new Date(checkout_started_at);
  const now = new Date();
  const diffInMillisecondsBtwCheckoutStart = now - checkoutStartedAt;
  // Convert the difference to hours
  const diffInHoursBtwCheckoutStart = diffInMillisecondsBtwCheckoutStart / 1000 / 60 / 60;

  if (cohort.second_reminder_active && diffInHoursBtwCheckoutStart > cohort.second_reminder_time) {
    return "2";
  } else if (cohort.first_reminder_active && diffInHoursBtwCheckoutStart > cohort.first_reminder_time) {
    return "1";
  }

  return null;
}

async function construct_message(recipientPhone, cohort, reminder, personName, product_list, store_names) {
  let message = cohort[`message_opener${reminder}`] + '\n' + '\n';

  // Construct the product list string
  const productListString = product_list.map((product, index) =>
    `${index + 1}. ` + cohort[`product_list${reminder}`]
        .replace('{productName}', product.product_name)
        .replace('{variantTitle}', product.variant_title ? ": " + product.variant_title : ''),
  ).join('\n');

  message += productListString + '\n'+ '\n';

  // Add discount message if applicable
  if ((Number(reminder) === 1 && cohort.discount_in_first) || (Number(reminder) === 2 && cohort.discount_in_second)) {
    const discountMessage = cohort[`discount_message${reminder}`]
        .replace('{discountAmount}', cohort[`discount_amount_in_${reminder}`]);
      // I need to store that this person has a discount here!
    message += discountMessage + '\n'+ '\n';
  }
  await firebase_service.apply_discount_to_customer(recipientPhone, cohort[`discount_amount_in_${reminder}`]);

  // Add closing message
  message += cohort[`message_close${reminder}`];

  // Replace personName placeholder
  message = message.replace('{personName}', personName);
  message = message.replace('{humanName}', store_names.human_name);
  message = message.replace('{brandName}', store_names.brand_name);

  return message;
}

async function sendMessageToCohortCustomer(shop, recipientPhone, personName = null, cohort, product_list, checkoutStartedAt) {
  try {
    const keys = await firebase_service.get_whatsapp_keys(shop);
    const store_names = await firebase_service.get_store_humanName_brandName(shop);
    const last_text_to_customer = await firebase_service.get_last_message_to_customer(shop, recipientPhone);
    let reminder;
    if (!last_text_to_customer) {
      reminder = first_or_second_reminder_without_last_text(cohort, checkoutStartedAt);
    } else {
      reminder = first_or_second_reminder(cohort, last_text_to_customer, checkoutStartedAt);
    }
    const message = await construct_message(recipientPhone, cohort, reminder, personName, product_list, store_names);
    const Whatsapp_URL = `https://graph.facebook.com/v18.0/${keys.whatsapp_phone_number_id}/messages`;
    const Whatsapp_headers = {
      'Authorization': `Bearer ${keys.whatsapp_access_token}`,
      'Content-Type': 'application/json',
    };
    const data = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'image',
      image: {
        link: product_list[0].images[0],
        caption: message,
      },
    };
    console.log("Data is: ", data);
    await firebase_service.increment_conversations(shop, recipientPhone);
    await firebase_service.increment_messages(shop, "You", recipientPhone, message);
    const response = await axios.post(Whatsapp_URL, data, {headers: Whatsapp_headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
}

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
      const payment_details = await stripe_service.get_card_details(payment_method_id, shop);
      const customer_id = await firebase_service.get_customer_id(recipientPhone, shop);
      const customer = await stripe_service.get_customer_address(customer_id, shop);
      return create_confirmation_message(payment_details, customer.address, messageTemplate);
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

function create_confirmation_message(card_details, address_details, message_template) {
  const brand = card_details.card.brand;
  const capitalizedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
  const last4 = card_details.card.last4;
  const address = `${address_details.line1}, ${address_details.line2}, ${address_details.city}, ${address_details.state}, ${address_details.postal_code}, ${address_details.country}`;
  const message = message_template
      .replace('{brand}', capitalizedBrand)
      .replace('{last4}', last4)
      .replace('{address}', address);
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

module.exports = {sendMessage, sendMessageToCohortCustomer};
