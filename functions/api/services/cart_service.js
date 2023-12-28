const {getOpenAIResponse} = require('../services/openai_service');
const {sendMessage, sendPaymentLinkMessage} = require('../services/whatsapp_service');
const admin = require("firebase-admin");
const {generatePaymentLink} = require('../services/stripe_service');
// const OpenAI = require("openai");
// require('dotenv').config();
// const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

function is_text_handleable(text) {
  // if (text === "ADD" || text === "BUY") return true;
  if (text === "BUY") return true;
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

const handleCart = async (userPhone, message) => {
  try {
    const handle_text = is_text_handleable(message);

    // let cart;
    if (handle_text) {
      console.log("I need to handle this text");
      // ToDo: get the product's id
      const product_id = await get_product_id(userPhone);
      // ToDo: pass this product id to the stripe api to generate a link with it
      const payment_url = await generatePaymentLink(product_id);
      console.log("Payment link is: ", payment_url);
      // ToDo: pass this payment link to the whatsapp service with the phone number of the user
      await sendPaymentLinkMessage(userPhone, payment_url);
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
