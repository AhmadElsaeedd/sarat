const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// const db = admin.firestore();

function is_text_handleable(text) {
  if (text === "ADD" || text === "YES") return true;
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

const handleCart = async (userPhone, message) => {
  try {
    const handle_text = is_text_handleable(message);

    // let cart;
    if (handle_text) {
    //   cart = await get_user_cart(userPhone);
      console.log("I need to handle this text");
      // ToDo: get the product's id from stripe
    }


    // return messages.data[0].content[0].text.value;
  } catch (error) {
    console.error("Error in Cart Service:", error);
    throw error;
  }
};

module.exports = {handleCart};
