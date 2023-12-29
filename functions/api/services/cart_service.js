const {getOpenAIResponse} = require('../services/openai_service');
const {sendMessage, sendPaymentLinkMessage} = require('../services/whatsapp_service');
const {sendConfirmationMessage} = require('../services/whatsapp_service');
const {sendSuccessMessage} = require('../services/whatsapp_service');
const admin = require("firebase-admin");
// const {generatePaymentLink} = require('../services/stripe_service');
const {generateCheckoutSession} = require('../services/stripe_service');
const {generatePaymentIntent} = require('../services/stripe_service');
const {confirmPaymentIntent} = require('../services/stripe_service');
// const OpenAI = require("openai");
// require('dotenv').config();
// const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

function is_text_handleable(text) {
  if (text.toLowerCase() === "yes") return true;
  else return false;
}

// async function get_user_cart(userPhone) {
//   const user_doc = await db.collection('Users').doc(userPhone).get();

//   if (user_doc.exists) {
//     const cart = user_doc.data().cart;
//     return cart;
//   }
// }

async function get_product_id(userPhone) {
  const user_doc = await db.collection('Users').doc(userPhone).get();

  if (user_doc.exists) {
    const product_id = user_doc.data().current_product;
    return product_id;
  }
}

// async function add_to_cart(cart, product_id) {
//   // ToDo: add the product id to the cart array
// }

async function user_has_customer_id(userPhone) {
  const user_doc = await db.collection('Users').doc(userPhone).get();
  const user_data = user_doc.data();
  if (user_doc.exists && user_data.customer_id) {
    return true;
  } else return false;
}

async function get_status(userPhone) {
  const user_doc = await db.collection('Users').doc(userPhone).get();
  const user_data = user_doc.data();
  if (user_doc.exists) {
    return user_data.payment_intent_status;
  } else return null;
}

const handleCart = async (userPhone, message) => {
  try {
    const handle_text = is_text_handleable(message);

    // let cart;
    if (handle_text) {
      // ToDo: get the product's id
      const product_id = await get_product_id(userPhone);
      // ToDo: see if the user is returning or is first time
      const returning_user = await user_has_customer_id(userPhone);
      if (!returning_user) {
        // First time user
        // ToDo: pass this product id to the stripe api to generate a link with it
        // const payment_link = await generatePaymentLink(userPhone, product_id);
        // Instead of a payment link, generate a checkout session with the link generated from the generate payment link function
        const checkout_session = await generateCheckoutSession(userPhone, product_id);
        // ToDo: pass this payment link to the whatsapp service with the phone number of the user
        await sendPaymentLinkMessage(userPhone, checkout_session.url);
        // await sendPaymentLinkMessage(userPhone, payment_link.url);
      } else {
        console.log("This is a returning user");
        const status = await get_status(userPhone);
        if (status === "succeeded" || status === "") {
          // ToDo: generate a payment intent of that user
          const payment_intent = await generatePaymentIntent(userPhone, product_id);
          // ToDo: send a message to confirm the payment intent
          await sendConfirmationMessage(userPhone, payment_intent.payment_method);
        } else if (status === "requires_confirmation") {
          const payment_intent = await confirmPaymentIntent(userPhone);
          await sendSuccessMessage(userPhone, payment_intent.status);
        }
        // Returning user
      }
    } else {
      const aiResponse = await getOpenAIResponse(userPhone, message);
      // ToDo: pass this response to the whatsapp function that sends a message back to the user
      await sendMessage(userPhone, aiResponse);
    }


    // return messages.data[0].content[0].text.value;
  } catch (error) {
    console.error("Error in Cart Service:", error);
    throw error;
  }
};

module.exports = {handleCart};
