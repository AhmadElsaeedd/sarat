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

// async function construct_message(recipientPhone, cohort, reminder, personName, product_list, store_names, currency) {
//   let message = cohort[`message_opener${reminder}`] + '\n' + '\n';

//   // Construct the product list string
//   const productListString = product_list.map((product, index) =>
//     `${index + 1}. ` + cohort[`product_list${reminder}`]
//         .replace('{productName}', product.product_name)
//         .replace('{variantTitle}', product.variant_title ? ": " + product.variant_title : ''),
//   ).join('\n');

//   message += productListString + '\n'+ '\n';

//   // Get the price
//   let price = 0;
//   for (const product of product_list) {
//     price += product.price_in_presentment_currency;
//   }
//   const priceMessage = cohort[`message_price${reminder}`].replace('{price}', price).replace('{currency}', currency);
//   message += priceMessage + '\n' + '\n';

//   // Add discount message if applicable
//   if ((Number(reminder) === 1 && cohort.discount_in_first) || (Number(reminder) === 2 && cohort.discount_in_second)) {
//     const discountMessage = cohort[`discount_message${reminder}`]
//         .replace('{discountAmount}', cohort[`discount_amount_in_${reminder}`]);
//       // I need to store that this person has a discount here!
//     message += discountMessage + '\n'+ '\n';
//   }
//   await firebase_service.apply_discount_to_customer(recipientPhone, cohort[`discount_amount_in_${reminder}`]);

//   // Add closing message
//   message += cohort[`message_close${reminder}`];

//   // Replace personName placeholder
//   message = message.replace('{personName}', personName);
//   message = message.replace('{humanName}', store_names.human_name);
//   message = message.replace('{brandName}', store_names.brand_name);

//   return message;
// }

async function get_message_template(cohort, reminder) {
  if (reminder === "1") {
    return cohort.intro_message1;
  } else if (reminder === "2") {
    return cohort.intro_message2;
  }
}

async function get_discount_amount(recipientPhone, cohort, reminder) {
  let discount = 0;
  // Add discount message if applicable
  if ((Number(reminder) === 1 && cohort.discount_in_first) || (Number(reminder) === 2 && cohort.discount_in_second)) {
    discount = cohort[`discount_amount_in_${reminder}`];
  }
  await firebase_service.apply_discount_to_customer(recipientPhone, cohort[`discount_amount_in_${reminder}`]);
  return discount;
}

function get_product_names(product_list) {
  const productNames = product_list.map((product) => product.product_name);
  const lastProductName = productNames.pop();

  if (productNames.length > 0) {
    return `${productNames.join(', ')}, and ${lastProductName}`;
  } else {
    return lastProductName;
  }
}

function get_total_price(product_list) {
  return product_list.reduce((total, product) => total + product.price_in_presentment_currency, 0);
}

function get_amount_reduced(totalPrice, discountAmount) {
  return (totalPrice * discountAmount) / 100;
}

function get_preson_name(personName) {
  if (personName === null) {
    return "";
  } else {
    return personName;
  }
}

function construct_message_content(personName, store_human_name, brand_name, product_names, discount_amount, total_price, currency, amount_reduced, message_template_content) {
  let message = message_template_content;
  message = message.replace('{{1}}', personName)
      .replace('{{2}}', store_human_name)
      .replace('{{3}}', brand_name)
      .replace('{{4}}', product_names)
      .replace('{{5}}', discount_amount)
      .replace('{{6}}', total_price)
      .replace('{{7}}', currency)
      .replace('{{8}}', amount_reduced);
  return message;
}

async function sendMessageToCohortCustomer(shop, recipientPhone, personName = null, cohort, product_list, checkoutStartedAt, presentment_currency) {
  try {
    const keys = await firebase_service.get_whatsapp_keys(shop);
    // console.log("Keys:", keys);

    const store_names = await firebase_service.get_store_humanName_brandName(shop);
    // console.log("Store Names:", store_names);

    const last_text_to_customer = await firebase_service.get_last_message_to_customer(shop, recipientPhone);
    // console.log("Last Text to Customer:", last_text_to_customer);

    let reminder;
    if (!last_text_to_customer) {
      reminder = first_or_second_reminder_without_last_text(cohort, checkoutStartedAt);
    } else {
      reminder = first_or_second_reminder(cohort, last_text_to_customer, checkoutStartedAt);
    }
    // console.log("Reminder:", reminder);

    const message_template = await get_message_template(cohort, reminder);
    // console.log("Message Template:", message_template);
    const message_template_content = message_template.text;
    const message_template_name = message_template.name;

    const discount_amount = await get_discount_amount(recipientPhone, cohort, reminder);
    // console.log("Discount Amount:", discount_amount);

    const product_names = get_product_names(product_list);
    // console.log("Product Names:", product_names);

    const total_price = get_total_price(product_list);
    // console.log("Total Price:", total_price);

    const amount_reduced = get_amount_reduced(total_price, discount_amount);
    // console.log("Amount Reduced:", amount_reduced);

    const person_name = get_preson_name(personName);
    // console.log("Person Name:", person_name);

    const message_for_firebase = construct_message_content(person_name, store_names.human_name, store_names.brand_name, product_names, discount_amount, total_price.toString(), presentment_currency, amount_reduced, message_template_content);
    // console.log("Message for Firebase:", message_for_firebase);

    const Whatsapp_URL = `https://graph.facebook.com/v19.0/${keys.whatsapp_phone_number_id}/messages`;
    const Whatsapp_headers = {
      'Authorization': `Bearer ${keys.whatsapp_access_token}`,
      'Content-Type': 'application/json',
    };

    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'template',
      template: {
        name: message_template_name,
        language: {
          code: 'en_US',
        },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'image',
                image: {
                  link: product_list[0].images[0],
                },
              },
            ],
          },
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: person_name,
              },
              {
                type: 'text',
                text: store_names.human_name,
              },
              {
                type: 'text',
                text: store_names.brand_name,
              },
              {
                type: 'text',
                text: product_names,
              },
              {
                type: 'text',
                text: discount_amount,
              },
              {
                type: 'text',
                text: total_price.toString(),
              },
              {
                type: 'text',
                text: presentment_currency,
              },
              {
                type: 'text',
                text: amount_reduced,
              },
            ],
          },
        ],
      },
    };

    await firebase_service.increment_conversations(shop, recipientPhone);
    await firebase_service.increment_messages(shop, "You", recipientPhone, message_for_firebase, null);

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
    const product_list = await firebase_service.get_product_list(recipientPhone);
    messageContent = await getMessageContent(recipientPhone, message_type, messageContent, product_list, productName, personName, productSize, paymentURL, refund_status, payment_status, payment_method_id, messageTemplate, shop);
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
    await firebase_service.increment_messages(shop, "You", recipientPhone, messageContent, null);
    const response = await axios.post(Whatsapp_URL, data, {headers: Whatsapp_headers});
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response ? error.response.data : error.message);
  }
}

async function getMessageContent(recipientPhone, message_type, messageContent, productList, productName, personName, productSize, paymentURL, refund_status, payment_status, payment_method_id, messageTemplate, shop) {
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
      const shop_domain = await firebase_service.get_store_brand_domain(shop);
      await firebase_service.update_conversation_status(shop, recipientPhone, "Payment Pending");
      return create_payment_link_message(paymentURL, messageTemplate, shop_domain);
    }
    case 'payment_confirmation_message': {
      await firebase_service.update_conversation_status(shop, recipientPhone, "Payment Pending");
      // get the product details here as well
      const [payment_details, customer_id, currency, price, product_names] = await Promise.all([
        stripe_service.get_card_details(payment_method_id, shop),
        firebase_service.get_customer_id(recipientPhone, shop),
        firebase_service.get_store_currency(shop),
        firebase_service.get_price_for_confirmation(recipientPhone),
        get_product_names(productList),
      ]);

      const customer = await stripe_service.get_customer_address(customer_id, shop);
      return create_confirmation_message(payment_details, customer.address, messageTemplate, price, currency, product_names);
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
    case 'cancellation_confirmation':
      return "Are you sure you want to cancel your order?\n\nSay \"Yes\" to cancel.";
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

function create_payment_link_message(paymentURL, message_template, shopUrl) {
  // shopUrl is the url that I want to replace {paymentURL} with but when the url is clicked i want it to redirect to paymentURL
  // const anchorTag = `<a href="${paymentURL}">${shopUrl}</a>`;
  // const message = message_template.replace('{paymentURL}', anchorTag).replace(/\\n/g, '\n');
  const message = message_template.replace('{paymentURL}', paymentURL).replace(/\\n/g, '\n');
  return message;
}

function create_confirmation_message(card_details, address_details, message_template, price, currency, products) {
  const brand = card_details.card.brand;
  const capitalizedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
  const last4 = card_details.card.last4;
  const address = `${address_details.line1}, ${address_details.line2}, ${address_details.city}, ${address_details.state}, ${address_details.postal_code}, ${address_details.country}`;
  const message = message_template
      .replace('{brand}', capitalizedBrand)
      .replace('{last4}', last4)
      .replace('{address}', address)
      .replace('{price}', price)
      .replace('{currency}', currency)
      .replace('{products}', products)
      .replace(/\\n/g, '\n');
  return message;
}

function create_success_message(payment_status, message_template) {
  const capitalizedStatus = payment_status.charAt(0).toUpperCase() + payment_status.slice(1);
  const message = message_template.replace('{payment_status}', capitalizedStatus).replace(/\\n/g, '\n');
  return message;
}

function create_refund_message(refund_status, message_template) {
  const capitalizedStatus = refund_status.charAt(0).toUpperCase() + refund_status.slice(1);
  const message = message_template.replace('{refund_status}', capitalizedStatus);
  return message;
}

module.exports = {sendMessage, sendMessageToCohortCustomer};
