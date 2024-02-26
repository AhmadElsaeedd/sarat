const admin = require("firebase-admin");
const axios = require('axios');

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

async function user_has_customer_id(userPhone) {
  try {
    const user_doc = await db.collection('Customers').doc(userPhone).get();
    const user_data = user_doc.data();
    if (user_doc.exists && user_data.customer_id) {
      return true;
    } else return false;
  } catch (error) {
    console.error("Error in getting customer id: ", error);
    throw error;
  }
}

async function get_product_id(userPhone) {
  try {
    const user_doc = await db.collection('Customers').doc(userPhone).get();

    if (user_doc.exists) {
      const product_id = user_doc.data().current_product;
      return product_id;
    }
  } catch (error) {
    console.error("Error in getting product id: ", error);
    throw error;
  }
}

async function get_product_ids(userPhone) {
  try {
    const user_doc = await db.collection('Customers').doc(userPhone).get();

    if (user_doc.exists) {
      const product_list = user_doc.data().current_product_list;
      const stripe_product_ids = product_list.map((product) => product.stripe_product_id);
      return stripe_product_ids;
    }
  } catch (error) {
    console.error("Error in getting product id: ", error);
    throw error;
  }
}

async function get_product_list(userPhone) {
  const user_doc = await db.collection('Customers').doc(userPhone).get();
  try {
    if (user_doc.exists) {
      const product_list = user_doc.data().current_product_list;
      return product_list;
    }
  } catch (error) {
    console.error("Error in getting product list: ", error);
    throw error;
  }
}

async function get_price_for_confirmation(userPhone) {
  try {
    const user_doc = await db.collection('Customers').doc(userPhone).get();

    if (user_doc.exists) {
      const product_list = user_doc.data().current_product_list;
      const discount_amount = user_doc.data().current_discount_amount;
      let price_amount = 0;
      for (const product of product_list) {
        price_amount += product.price_in_presentment_currency;
      }
      if (discount_amount && discount_amount > 0) {
        price_amount = price_amount * (100-discount_amount)/100;
      }
      return price_amount;
    }
  } catch (error) {
    console.error("Error in getting product id: ", error);
    throw error;
  }
}


async function update_current_product(phoneNumber, product_list) {
  const user_ref = db.collection('Customers').doc(phoneNumber);
  // Update the document
  await user_ref.set({
    current_product_list: product_list,
    phone_number: phoneNumber,
  }, {merge: true});
}

async function get_status(userPhone) {
  const user_doc = await db.collection('Customers').doc(userPhone).get();
  const user_data = user_doc.data();
  if (user_doc.exists) {
    return user_data.payment_intent_status;
  } else return null;
}

async function check_user_thread(userPhone) {
  const user_doc = await db.collection('Customers').doc(userPhone).get();
  const user_data = user_doc.data();

  if (user_doc.exists && user_data.thread_id) {
    const thread_id = user_data.thread_id;
    return thread_id;
  }
  return null;
}

async function create_user(userPhone, thread_id) {
  await db.collection('Customers').doc(userPhone).set({
    phone_number: userPhone,
    thread_id: thread_id,
  }, {merge: true});
}

async function get_customer_data(phoneNumber) {
  const user_doc = await db.collection('Customers').doc(phoneNumber).get();
  const user_data = user_doc.data();
  if (user_doc.exists && user_data.customer_id && user_data.payment_method) {
    return user_data;
  } else return null;
}

async function update_status(phoneNumber, payment_intent) {
  const user_ref = db.collection('Customers').doc(phoneNumber);

  await user_ref.set({
    current_payment_intent: payment_intent.id,
    payment_intent_status: payment_intent.status,
    payment_intent_client_secret: payment_intent.client_secret,
  }, {merge: true});
}

async function set_status(phoneNumber, status) {
  const user_ref = db.collection('Customers').doc(phoneNumber);

  await user_ref.set({
    payment_intent_status: status,
  }, {merge: true});
}

async function store_data(customer, phoneNumber, payment_method) {
  if (typeof phoneNumber === 'number') {
    phoneNumber = phoneNumber.toString();
  }
  const user_ref = db.collection('Customers').doc(phoneNumber);

  console.log("Customer is: ", customer);

  // Purchase complete now I want to store the user's data
  await user_ref.set({
    payment_intent_status: "",
    payment_method: payment_method,
    customer_id: customer.id,
    customer_email: customer.email,
  }, {merge: true});
}

async function save_store_data(shop, access_token, shop_data) {
  const stores_ref =db.collection('Shopify Stores').doc(shop);

  // Generate a 4 character invitation code using lowercase characters and numbers
  const invitation_code = (Math.random().toString(36)+'000000').substring(2, 8);

  await stores_ref.set({
    brand_name: shop_data.name,
    domain: shop_data.domain,
    human_name: shop_data.shop_owner,
    stripe_secret_token: "",
    stripe_endpoint_secret: "",
    whatsapp_access_token: "",
    whatsapp_phone_number_id: "",
    automatic: true,
    images_included: true,
    currency: shop_data.currency,
    invitation_code: invitation_code,
    shopify_access_token: access_token,
    shop: shop,
    payment_link_message: "Perfect! You can reserve your item(s) by entering your details here now: \n \n{paymentURL}!",
    payment_confirmation_message: "Awesome! Just to confirm: \n \n💳 {brand} card ending with {last4} \n🏡{address} \n📦{products} \n💰{price}{currency} \n \nJust say 'Yes' to confirm, or 'Edit' to edit your card details or address. You'll be able to cancel in the next 24 hours.",
    success_message: "{payment_status}! \nText us 'Cancel' to cancel, only in the next 24 hours.",
    refund_message: "{refund_status}. \n \n Your payment has been canceled and the amount will be refunded to your card.",
  }, {merge: true});
}

async function get_store_access_token(shop) {
  const store_doc = await db.collection('Shopify Stores').doc(shop).get();
  const store_data = store_doc.data();
  if (store_doc.exists) {
    return store_data.shopify_access_token;
  }
  return null;
}

async function get_store_currency(shop) {
  const store_doc = await db.collection('Shopify Stores').doc(shop).get();
  const store_data = store_doc.data();
  if (store_doc.exists) {
    return store_data.currency;
  }
  return null;
}

async function get_store_brand_domain(shop) {
  const store_doc = await db.collection('Shopify Stores').doc(shop).get();
  const store_data = store_doc.data();
  if (store_doc.exists) {
    return store_data.brand_name;
  }
  return null;
}

async function increment_total_messages(shop) {
  const store_ref = db.collection('Shopify Stores').doc(shop);

  await store_ref.update({
    total_messages: admin.firestore.FieldValue.increment(1),
  });
}

async function increment_messages(shop, sent_by, sent_to, message_content, message_id) {
  const messageRef = db.collection('Shopify Stores').doc(shop).collection('Messages');
  await messageRef.add({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    sent_by: sent_by,
    sent_to: sent_to,
    message_content: message_content,
    message_id: message_id,
  });
}

async function increment_number_of_conversations(shop) {
  const store_ref = db.collection('Shopify Stores').doc(shop);

  await store_ref.update({
    total_conversations: admin.firestore.FieldValue.increment(1),
  });
}

async function increment_conversations(shop, phone_number) {
  const conversationRef = db.collection('Shopify Stores').doc(shop).collection('Conversations');
  const snapshot = await conversationRef.where('user_phone_number', '==', phone_number).get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    await doc.ref.set({
      status: "Selling",
    }, {merge: true});
  } else {
    await conversationRef.add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      user_phone_number: phone_number,
      status: "Selling",
    });
  }
}

async function update_conversation_status(shop, phone_number, status) {
  const conversationRef = db.collection('Shopify Stores').doc(shop).collection('Conversations');

  const snapshot = await conversationRef.where('user_phone_number', '==', phone_number).get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    await doc.ref.set({
      status: status,
    }, {merge: true});
  } else {
    console.log(`No conversation found for phone number: ${phone_number}`);
  }
}

async function start_conversation(phoneNumber, shop, product_list) {
  const user_ref = db.collection('Customers').doc(phoneNumber);

  await user_ref.set({
    // shopify_customer_id: shopify_customer_id,
    current_product_list: product_list,
    phone_number: phoneNumber,
    in_conversation_with: shop,
    payment_intent_status: "",
  }, {merge: true});
}

async function increment_sales(shop, amount, payment_id, user_data) {
  const salesRef = db.collection('Shopify Stores').doc(shop).collection('Sales').doc(payment_id);
  await salesRef.set({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    amount: amount,
    refunded: false,
    product_list: user_data.current_product_list,
    discount_applied: user_data.current_discount_amount,
    // Add other relevant data for the sale
  });
}

async function refund_sale(shop, payment_id) {
  const saleRef = db.collection('Shopify Stores').doc(shop).collection('Sales').doc(payment_id);
  // Update the existing sale record to indicate a reversal or cancellation
  await saleRef.update({
    refunded: true,
    refundTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    // Other relevant reversal details
  });
}

async function get_users_conversation(userPhone) {
  const user_doc = await db.collection('Customers').doc(userPhone).get();
  const user_data = user_doc.data();
  if (user_doc.exists) {
    return user_data.in_conversation_with;
  } else return null;
}

async function get_message_template(shop, type) {
  const store_doc = await db.collection('Shopify Stores').doc(shop).get();
  const store_data = store_doc.data();
  if (store_doc.exists) {
    switch (type) {
      case 'abandoned_cart_message': {
        // handle getting each message template template
        return store_data.abandoned_cart_message;
      }
      case 'restock_message': {
        return store_data.restock_message;
      }
      case 'refill_message': {
        return store_data.refill_message;
      }
      case 'payment_link_message': {
        return store_data.payment_link_message;
      }
      case 'payment_confirmation_message': {
        return store_data.payment_confirmation_message;
      }
      case 'success_message': {
        return store_data.success_message;
      }
      case 'refund_message': {
        return store_data.refund_message;
      }
    }
  } else return null;
}

async function update_message_template(shop, type, content) {
  const store_ref = db.collection('Shopify Stores').doc(shop);

  switch (type) {
    case 'abandoned_cart_message': {
      // handle the update of the abandoned cart template
      await store_ref.set({
        abandoned_cart_message: content,
      }, {merge: true});
      break;
    }
    case 'restock_message': {
      await store_ref.set({
        restock_message: content,
      }, {merge: true});
      break;
    }
    case 'refill_message': {
      await store_ref.set({
        refill_message: content,
      }, {merge: true});
      break;
    }
    case 'payment_link_message': {
      await store_ref.set({
        payment_link_message: content,
      }, {merge: true});
      break;
    }
    case 'payment_confirmation_message': {
      await store_ref.set({
        payment_confirmation_message: content,
      }, {merge: true});
      break;
    }
    case 'success_message': {
      await store_ref.set({
        success_message: content,
      }, {merge: true});
      break;
    }
    case 'refund_message': {
      await store_ref.set({
        refund_message: content,
      }, {merge: true});
      break;
    }
    // ... handle other message templates
    default:
      console.log(`Unhandled update of message template for template: ${type}`);
  }
}

async function get_whatsapp_keys(shop) {
  const shop_doc = await db.collection('Shopify Stores').doc(shop).get();
  const shop_data = shop_doc.data();
  if (shop_doc.exists) {
    return {
      whatsapp_access_token: shop_data.whatsapp_access_token,
      whatsapp_phone_number_id: shop_data.whatsapp_phone_number_id,
      whatsapp_business_account_id: shop_data.whatsapp_business_account_id,
    };
  } else return null;
}

async function get_store_humanName_brandName(shop) {
  const shop_doc = await db.collection('Shopify Stores').doc(shop).get();
  const shop_data = shop_doc.data();
  if (shop_doc.exists) {
    return {
      brand_name: shop_data.brand_name,
      human_name: shop_data.human_name,
    };
  } else return null;
}

async function get_stripe_key(shop) {
  const shop_doc = await db.collection('Shopify Stores').doc(shop).get();
  const shop_data = shop_doc.data();
  if (shop_doc.exists) {
    return shop_data.stripe_secret_token;
  } else return null;
}

async function get_stripe_endpoint_secret(shop) {
  const shop_doc = await db.collection('Shopify Stores').doc(shop).get();
  const shop_data = shop_doc.data();
  if (shop_doc.exists) {
    return shop_data.stripe_endpoint_secret;
  } else return null;
}

async function get_cohorts(shop) {
  const cohorts_query = db.collection('Shopify Stores').doc(shop).collection("Cohorts");
  const cohortsSnapshot = await cohorts_query.get();

  return cohortsSnapshot.docs.map((doc) => doc.data());
}

async function get_last_message_to_customer(shop, phoneNumber) {
  const messages_reference = db.collection('Shopify Stores').doc(shop).collection('Messages');
  const snapshot = await messages_reference
      .where('sent_to', '==', phoneNumber)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

  if (snapshot.empty) {
    return null;
  }
  return snapshot.docs[0].data();
}

async function get_last_message_by_customer(shop, phoneNumber) {
  const messages_reference = db.collection('Shopify Stores').doc(shop).collection('Messages');
  const snapshot = await messages_reference
      .where('sent_by', '==', phoneNumber)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

  return snapshot.docs[0].data();
}

async function get_customer_id(phoneNumber) {
  const user_doc = await db.collection('Customers').doc(phoneNumber).get();
  const user_data = user_doc.data();
  if (user_doc.exists && user_data.customer_id) {
    return user_data.customer_id;
  } else return null;
}

async function apply_discount_to_customer(phoneNumber, discount_amount) {
  if (typeof phoneNumber === 'number') {
    phoneNumber = phoneNumber.toString();
  }
  const user_ref = db.collection('Customers').doc(phoneNumber);

  // Purchase complete now I want to store the user's data
  await user_ref.set({
    current_discount_amount: discount_amount,
  }, {merge: true});
}

async function use_discount(phoneNumber) {
  if (typeof phoneNumber === 'number') {
    phoneNumber = phoneNumber.toString();
  }
  const user_ref = db.collection('Customers').doc(phoneNumber);

  // Purchase complete now I want to store the user's data
  await user_ref.set({
    current_discount_amount: 0,
  }, {merge: true});
}

async function get_discount_amount(phoneNumber) {
  const user_doc = await db.collection('Customers').doc(phoneNumber).get();
  const user_data = user_doc.data();
  if (user_doc.exists && user_data.current_discount_amount) {
    return user_data.current_discount_amount;
  } else return null;
}

async function does_message_exist(shop, messageId) {
  if (typeof shop !== 'string' || shop.trim() === '') {
    throw new Error('Invalid shop parameter. Shop must be a non-empty string.');
  }

  console.log("LOOKING FOR MESSAGE IN DB");
  console.log("Shop is: ", shop);
  console.log("Message id is: ", messageId);
  const messages_reference = db.collection('Shopify Stores').doc(shop).collection('Messages');
  const snapshot = await messages_reference
      .where('message_id', '==', messageId)
      .get();
  return !snapshot.empty;
}

async function update_cart(shopDomain, cart) {
  const cartRef = db.collection('Shopify Stores').doc(shopDomain).collection('Carts');
  const snapshot = await cartRef.where('token', '==', cart.token).get();

  let docRef;
  if (!snapshot.empty) {
    docRef = snapshot.docs[0].ref;
  } else {
    docRef = cartRef.doc(); // Create a new document reference
  }

  console.log("updated cart document");

  await docRef.set(cart, {merge: true});
}

async function delete_carts(shop, checkout) {
  const cartRef = db.collection('Shopify Stores').doc(shop).collection('Carts');
  const snapshot = await cartRef.where('id', '==', checkout.cart_token).get();

  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

async function set_new_order(phoneNumber, orderId) {
  if (typeof phoneNumber === 'number') {
    phoneNumber = phoneNumber.toString();
  }
  const user_ref = db.collection('Customers').doc(phoneNumber);

  // Purchase complete now I want to store the user's data
  await user_ref.set({
    shopify_order_id: orderId,
  }, {merge: true});
}

async function create_dynamic_link(url) {
  const dynamicLinksUrl = 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyDhFO3rinYOsX5_C7IpYw4KQTgbqgJNsYw';
  const linkRequest = {
    dynamicLinkInfo: {
      domainUriPrefix: 'https://app.textlet.io/checkout',
      link: url,
    },
    suffix: {
      option: 'SHORT',
    },
  };

  try {
    const response = await axios.post(dynamicLinksUrl, linkRequest);
    return response.data.shortLink;
  } catch (error) {
    console.error('Error creating dynamic link: ', error);
    throw error;
  }
}

async function get_abandoned_carts(shop) {
  const cartRef = db.collection('Shopify Stores').doc(shop).collection('Carts');
  const snapshot = await cartRef.get();

  const cartsWithPhoneNumber = snapshot.docs
      .map((doc) => doc.data())
      .filter((cart) => cart.phone_number !== undefined && cart.phone_number !== null && cart.line_items.length > 0);

  return cartsWithPhoneNumber;
}

async function set_new_message_templates(shop, message_templates, segment_id) {
  const cohort_ref = db.collection('Shopify Stores').doc(shop).collection('Cohorts').doc(segment_id);

  const templateData = {};
  for (let i = 0; i < message_templates.length; i++) {
    templateData[`intro_message${i+1}`] = message_templates[i];
  }

  await cohort_ref.set(templateData, {merge: true});
}

async function update_whatsapp_message_template(shop, message_template_id, content) {
  const cohort_ref = db.collection('Shopify Stores').doc(shop).collection('Cohorts');
  const snapshot = await cohort_ref.get();

  let docToUpdate = null;
  let messageToUpdate = null;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.intro_message1.id === message_template_id) {
      docToUpdate = doc;
      messageToUpdate = 'intro_message1';
    } else if (data.intro_message2.id === message_template_id) {
      docToUpdate = doc;
      messageToUpdate = 'intro_message2';
    }
  });

  if (docToUpdate) {
    await docToUpdate.ref.update({
      [`${messageToUpdate}.text`]: content,
    });
  } else {
    console.log(`No message template found with id: ${message_template_id}`);
  }
}

async function update_message_template_status(wabaID, message_template_name, status) {
  // Query for the document with the matching WABA ID
  const shopSnapshot = await db.collection('Shopify Stores').where('whatsapp_business_account_id', '==', wabaID).get();

  if (shopSnapshot.empty) {
    console.log(`No shop found with WABA ID: ${wabaID}`);
    return;
  }

  // Assuming there's only one shop with the given WABA ID
  const shopDoc = shopSnapshot.docs[0];
  const shop = shopDoc.id;

  console.log("Shop is: ", shop);

  // Proceed to get the documents in the "Cohorts" sub-collection
  const cohort_ref = db.collection('Shopify Stores').doc(shop).collection('Cohorts');
  const snapshot = await cohort_ref.get();

  let docToUpdate = null;
  let messageToUpdate = null;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.intro_message1.name === message_template_name) {
      docToUpdate = doc;
      messageToUpdate = 'intro_message1';
    } else if (data.intro_message2.name === message_template_name) {
      docToUpdate = doc;
      messageToUpdate = 'intro_message2';
    }
  });

  if (docToUpdate) {
    console.log("Message to update is: ", messageToUpdate);
    console.log("Status to update is: ", status);
    await docToUpdate.ref.update({
      [`${messageToUpdate}.status`]: status,
    });
  } else {
    console.log(`No message template found with name: ${message_template_name}`);
  }
}

async function get_message_template_ids(shop) {
  const cohort_ref = db.collection('Shopify Stores').doc(shop).collection('Cohorts');
  const snapshot = await cohort_ref.get();

  const result = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      intro_message1: {id: data.intro_message1.id},
      intro_message2: {id: data.intro_message2.id},
    };
  });

  return result;
}

async function get_message_template_names_of_segment(shop, segment_id) {
  const cohort_ref = db.collection('Shopify Stores').doc(shop).collection('Cohorts').doc(segment_id);
  const doc = await cohort_ref.get();

  if (doc.exists) {
    const data = doc.data();
    const names = [];
    if (data.intro_message1) {
      names.push(data.intro_message1.name);
    }
    if (data.intro_message2) {
      names.push(data.intro_message2.name);
    }
    return names;
  } else {
    console.log(`No segment found with id: ${segment_id}`);
    return null;
  }
}

async function get_shopify_keys(shop) {
  const shop_doc = await db.collection('Shopify Stores').doc(shop).get();
  const shop_data = shop_doc.data();
  if (shop_doc.exists) {
    return {
      shopify_api_key: shop_data.shopify_api_key,
      shopify_api_secret: shop_data.shopify_api_secret,
    };
  } else return null;
}

module.exports = {get_product_id, get_product_list, get_shopify_keys, get_message_template_ids, update_message_template_status, get_message_template_names_of_segment, update_whatsapp_message_template, set_new_message_templates, get_abandoned_carts, set_new_order, update_cart, set_status, create_dynamic_link, get_store_brand_domain, delete_carts, save_store_data, get_price_for_confirmation, does_message_exist, apply_discount_to_customer, use_discount, get_discount_amount, get_store_humanName_brandName, get_stripe_key, get_stripe_endpoint_secret, get_last_message_by_customer, get_customer_id, get_product_ids, user_has_customer_id, get_status, check_user_thread, create_user, get_customer_data, update_status, store_data, update_current_product, get_store_access_token, increment_total_messages, start_conversation, increment_number_of_conversations, get_users_conversation, get_message_template, update_message_template, increment_messages, increment_conversations, increment_sales, refund_sale, get_store_currency, update_conversation_status, get_whatsapp_keys, get_cohorts, get_last_message_to_customer};
