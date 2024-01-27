const admin = require("firebase-admin");

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
  }, {merge: true});
}

async function store_data(customer, phoneNumber, payment_method) {
  if (typeof phoneNumber === 'number') {
    phoneNumber = phoneNumber.toString();
  }
  const user_ref = db.collection('Customers').doc(phoneNumber);

  // Purchase complete now I want to store the user's data
  await user_ref.set({
    payment_intent_status: "",
    payment_method: payment_method,
    customer_id: customer.id,
    customer_email: customer.email,
  }, {merge: true});
}

async function save_store_access_token(shop, access_token) {
  const stores_ref =db.collection('Shopify Stores').doc(shop);

  // Generate a 4 character invitation code using lowercase characters and numbers
  const invitation_code = (Math.random().toString(36)+'000000').substring(2, 8);

  await stores_ref.set({
    currency: "usd",
    invitation_code: invitation_code,
    shopify_access_token: access_token,
    shop: shop,
    restock_message: "Hey {personName}, {productName} you loved is back! Text 'Yes' to claim yours!",
    refill_message: "Hey {personName}, would you like to buy {productName} again? Text 'Yes' to claim yours!",
    payment_link_message: "Awesome! go here to complete your payment {paymentURL}!",
    payment_confirmation_message: "Awesome! Are you sure you want to pay with your {brand} card ending with {last4}? Say 'Yes' to confirm. You will be able to cancel in the next 24 hours, if you wish.",
    success_message: "{payment_status}! Text us 'Cancel' to cancel, only in the next 24 hours.",
    refund_message: "{refund_status}. Your payment has been canceled and the amount will be refunded to your card.",
  }, {merge: true});

  const firstCohortDocument = {
    cart_value: [100, 300],
    cohort_id: "Pre-defined 1",
    cohort_type: "Pre-defined",
    cohort_number: 1,
    date_created: admin.firestore.FieldValue.serverTimestamp(),
    discount_amount_in_first: 0,
    discount_amount_in_second: 10,
    discount_in_first: false,
    discount_in_second: true,
    discount_message1: "I can give you a {discountAmount}% discount if you complete your purchase now.",
    discount_message2: "I can give you a {discountAmount}% discount if you complete your purchase now.",
    first_reminder_active: true,
    first_reminder_time: 1,
    items_in_cart: [0, 10],
    message_close1: "Just text \"Yes\" and I'll send you a checkout link!",
    message_close2: "Just text \"Yes\" and I'll send you a checkout link!",
    message_opener1: "Hey {personName}, I am {humanName} from {brandName}. I noticed that you left your cart without checking out. I can help you checkout here easily and quickly! Your cart contained:",
    message_opener2: "Hey {personName}, I am {humanName} from {brandName}. I noticed that you left your cart without checking out. I can help you checkout here easily and quickly! Your cart contained:",
    product_list1: "{productName} for {productPrice}",
    product_list2: "{productName} for {productPrice}",
    purchase_frequency: ["first_time", "returning"],
    second_reminder_active: true,
    second_reminder_time: 6,
  };

  // Define the contents of the second document
  const secondCohortDocument = {
    cart_value: [300, 0],
    cohort_id: "Pre-defined 2",
    cohort_type: "Pre-defined",
    cohort_number: 2,
    date_created: admin.firestore.FieldValue.serverTimestamp(),
    discount_amount_in_first: 0,
    discount_amount_in_second: 15,
    discount_in_first: false,
    discount_in_second: true,
    discount_message1: "I can give you a {discountAmount}% discount if you complete your purchase now.",
    discount_message2: "I can give you a {discountAmount}% discount if you complete your purchase now.",
    first_reminder_active: true,
    first_reminder_time: 2,
    items_in_cart: [0, 10],
    message_close1: "Just text \"Yes\" and I'll send you a checkout link!",
    message_close2: "Just text \"Yes\" and I'll send you a checkout link!",
    message_opener1: "Hey {personName}, I am {humanName} from {brandName}. I noticed that you left your cart without checking out. I can help you checkout here easily and quickly! Your cart contained:",
    message_opener2: "Hey {personName}, I am {humanName} from {brandName}. I noticed that you left your cart without checking out. I can help you checkout here easily and quickly! Your cart contained:",
    product_list1: "{productName} for {productPrice}",
    product_list2: "{productName} for {productPrice}",
    purchase_frequency: ["first_time"],
    second_reminder_active: true,
    second_reminder_time: 8,
  };

  // Add the first cohort document to the subcollection
  await stores_ref.collection('Cohorts').doc("Pre-defined 1").set(firstCohortDocument);

  // Add the second cohort document to the subcollection
  await stores_ref.collection('Cohorts').doc("Pre-defined 2").set(secondCohortDocument);
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

async function increment_total_messages(shop) {
  const store_ref = db.collection('Shopify Stores').doc(shop);

  await store_ref.update({
    total_messages: admin.firestore.FieldValue.increment(1),
  });
}

async function increment_messages(shop, sent_by, sent_to, message_content) {
  const messageRef = db.collection('Shopify Stores').doc(shop).collection('Messages');
  await messageRef.add({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    sent_by: sent_by,
    sent_to: sent_to,
    message_content: message_content,
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
    current_product_list: product_list,
    phone_number: phoneNumber,
    in_conversation_with: shop,
  }, {merge: true});
}

async function increment_number_of_sales(shop) {
  const store_ref = db.collection('Shopify Stores').doc(shop);

  await store_ref.update({
    total_sales: admin.firestore.FieldValue.increment(1),
  });
}

async function increment_sales(shop, amount, payment_id) {
  const salesRef = db.collection('Shopify Stores').doc(shop).collection('Sales').doc(payment_id);
  await salesRef.set({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    amount: amount,
    // Add other relevant data for the sale
  });
}

async function decrement_number_of_sales(shop) {
  const store_ref = db.collection('Shopify Stores').doc(shop);

  await store_ref.update({
    total_sales: admin.firestore.FieldValue.increment(-1),
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

async function increment_decrement_sales_volume(shop, amount) {
  const store_ref = db.collection('Shopify Stores').doc(shop);

  await store_ref.update({
    total_sales_volume: admin.firestore.FieldValue.increment(amount/100),
  });
}

async function get_users_conversation(userPhone) {
  const user_doc = await db.collection('Customers').doc(userPhone).get();
  const user_data = user_doc.data();
  if (user_doc.exists) {
    return user_data.in_conversation;
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
    };
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

  return snapshot.docs[0].data();
}

module.exports = {get_product_id, user_has_customer_id, get_status, check_user_thread, create_user, get_customer_data, update_status, store_data, update_current_product, save_store_access_token, get_store_access_token, increment_total_messages, start_conversation, increment_number_of_conversations, increment_number_of_sales, get_users_conversation, increment_decrement_sales_volume, decrement_number_of_sales, get_message_template, update_message_template, increment_messages, increment_conversations, increment_sales, refund_sale, get_store_currency, update_conversation_status, get_whatsapp_keys, get_cohorts, get_last_message_to_customer};
