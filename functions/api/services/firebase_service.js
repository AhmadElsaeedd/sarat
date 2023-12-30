const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

async function user_has_customer_id(userPhone) {
  try {
    const user_doc = await db.collection('Users').doc(userPhone).get();
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
    const user_doc = await db.collection('Users').doc(userPhone).get();

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
  const user_ref = db.collection('Users').doc(phoneNumber);
  // Update the document
  await user_ref.set({
    current_product: productId,
    phone_number: phoneNumber,
  }, {merge: true});
}

async function get_status(userPhone) {
  const user_doc = await db.collection('Users').doc(userPhone).get();
  const user_data = user_doc.data();
  if (user_doc.exists) {
    return user_data.payment_intent_status;
  } else return null;
}

async function check_user_thread(userPhone) {
  const user_doc = await db.collection('Users').doc(userPhone).get();
  const user_data = user_doc.data();

  if (user_doc.exists && user_data.thread_id) {
    const thread_id = user_data.thread_id;
    return thread_id;
  }
  return null;
}

async function create_user(userPhone, thread_id) {
  await db.collection('Users').doc(userPhone).set({
    phone_number: userPhone,
    thread_id: thread_id,
    cart: [],
  }, {merge: true});
}

async function get_customer_data(phoneNumber) {
  const user_doc = await db.collection('Users').doc(phoneNumber).get();
  const user_data = user_doc.data();
  if (user_doc.exists && user_data.customer_id && user_data.payment_method) {
    return user_data;
  } else return null;
}

async function update_status(phoneNumber, payment_intent) {
  const user_ref = db.collection('Users').doc(phoneNumber);

  await user_ref.set({
    current_payment_intent: payment_intent.id,
    payment_intent_status: payment_intent.status,
  }, {merge: true});
}

async function store_data(customer, phoneNumber, payment_method) {
  if (typeof phoneNumber === 'number') {
    phoneNumber = phoneNumber.toString();
  }
  const user_ref = db.collection('Users').doc(phoneNumber);

  // Purchase complete now I want to store the user's data
  await user_ref.set({
    payment_intent_status: "",
    payment_method: payment_method,
    customer_id: customer.id,
    customer_email: customer.email,
  }, {merge: true});
}

module.exports = {get_product_id, user_has_customer_id, get_status, check_user_thread, create_user, get_customer_data, update_status, store_data, update_current_product};
