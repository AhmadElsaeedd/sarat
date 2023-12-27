const admin = require("firebase-admin");
const OpenAI = require("openai");
require('dotenv').config();
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

function is_text_handleable(text) {
  if (text === "ADD" || text === "BUY") return true;
  else return false;
}

// async function get_user_cart(userPhone) {
//   const user_doc = await db.collection('Users').doc(userPhone).get();

//   if (user_doc.exists) {
//     const cart = user_doc.data().cart;
//     return cart;
//   }
// }

// async function add_to_cart(cart, product_id) {
//   // ToDo: add the product id to the cart array
// }

async function get_product_name(userPhone) {
  // let product_name;
  const user_doc = await db.collection('Users').doc(userPhone).get();
  const threadId = user_doc.data().thread_id;
  const user_thread = await openai.beta.threads.retrieve(threadId);
  const messages = await openai.beta.threads.messages.list(
      user_thread.id,
  );
  // find the second last text in the chat
  console.log("This is the text that contains the product", messages.data[0].content[0].text.value);
}

const handleCart = async (userPhone, message) => {
  try {
    const handle_text = is_text_handleable(message);

    // let cart;
    if (handle_text) {
    //   cart = await get_user_cart(userPhone);
      console.log("I need to handle this text");
      // ToDo: get the product's id from stripe
      await get_product_name(userPhone);
    }


    // return messages.data[0].content[0].text.value;
  } catch (error) {
    console.error("Error in Cart Service:", error);
    throw error;
  }
};

module.exports = {handleCart};
