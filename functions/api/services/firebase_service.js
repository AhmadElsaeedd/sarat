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


async function update_current_product(phoneNumber, productId) {
  const user_ref = db.collection('Customers').doc(phoneNumber);
  // Update the document
  await user_ref.set({
    current_product: productId,
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

  await stores_ref.set({
    shopify_access_token: access_token,
    shop: shop,
    total_messages: 0,
    total_sales: 0,
    total_conversations: 0,
    total_sales_volume: 0,
    abandoned_cart_message: "Hey${personName ? ' '+ personName + ',' : ','} would you like to buy ${productName} ${productSize ? 'in ' + productSize : ''} for a discount? Text 'Yes', and we'll send you a link with the discount code preloaded. Fast, fabulous fashion is just a message away!",
    restock_message: "Hey${personName ? ' '+ personName + ',' : ','} ${productName} ${productSize ? 'in ' + productSize : ''} you loved is back! Text 'Yes' to claim yours. Fast, fabulous fashion is just a message away!",
    payment_link_message: "Awesome! go here to complete your payment ${paymentURL}!",
    payment_confirmation_message: "Awesome! Are you sure you want to pay with your ${capitalizedBrand} card ending with ${last4}? Say 'Yes' to confirm. You will be able to cancel in the next 24 hours.",
    success_message: "${capitalizedStatus}! Text us 'Cancel' to cancel, only in the next 24 hours.",
    refund_message: "${capitalizedStatus}. Your payment has been canceled and the amount will be refunded to your card.",
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

async function increment_total_messages(shop) {
  const store_ref = db.collection('Shopify Stores').doc(shop);

  await store_ref.update({
    total_messages: admin.firestore.FieldValue.increment(1),
  });
}

async function increment_number_of_conversations(shop) {
  const store_ref = db.collection('Shopify Stores').doc(shop);

  await store_ref.update({
    total_conversations: admin.firestore.FieldValue.increment(1),
  });
}

async function user_enter_conversation(phoneNumber, shop) {
  const user_ref = db.collection('Customers').doc(phoneNumber);

  await user_ref.set({
    in_conversation: shop,
  }, {merge: true});
}

async function increment_number_of_sales(shop) {
  const store_ref = db.collection('Shopify Stores').doc(shop);

  await store_ref.update({
    total_sales: admin.firestore.FieldValue.increment(1),
  });
}

async function decrement_number_of_sales(shop) {
  const store_ref = db.collection('Shopify Stores').doc(shop);

  await store_ref.update({
    total_sales: admin.firestore.FieldValue.increment(-1),
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

module.exports = {get_product_id, user_has_customer_id, get_status, check_user_thread, create_user, get_customer_data, update_status, store_data, update_current_product, save_store_access_token, get_store_access_token, increment_total_messages, user_enter_conversation, increment_number_of_conversations, increment_number_of_sales, get_users_conversation, increment_decrement_sales_volume, decrement_number_of_sales, get_message_template, update_message_template};
