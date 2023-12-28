const {sendIntroMessage} = require('../services/whatsapp_service');
const admin = require("firebase-admin");
const stripe = require('stripe')('sk_test_51ORH1oCUveDWoBMaDE7JPwXOWNa9CIPQTiaWx3AXG05O9q4I2Ev6jwOP59f4zE1cpH84jC4NEq4aBiMGRHzWJnzM00mJCTwQx5');

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

async function update_current_product(phoneNumber, productName) {
  // ToDo: get the user document
  const user_ref = db.collection('Users').doc(phoneNumber);

  // Get the product id from stripe
  const products = await stripe.products.search({
    query: `name:'${productName}'`,
  });

  // Check if a product was found
  if (products.data.length === 0) {
    throw new Error(`Product with name ${productName} not found`);
  }

  // Get the product id out of the product object
  const productId = products.data[0].id;

  // Update the document
  // await user_ref.update({current_product: productId});
  await user_ref.set({
    current_product: productId,
  }, {merge: true});
}

const postTexting = async (req, res) => {
  try {
    // Required parameters
    const productName = req.body.productName;
    const phoneNumber = req.body.phoneNumber;
    if (!productName || !phoneNumber) {
      res.status(400).send('Missing required parameters');
    }
    // Update the document to be able to track what's happening
    update_current_product(phoneNumber, productName);
    // Optional parameters
    const personName = req.body.personName || null;
    const productSize = req.body.productSize || null;
    // Call sendIntroMessage
    await sendIntroMessage(phoneNumber, productName, personName, productSize);

    res.status(200).send('EVENT RECEIVED');
  } catch (error) {
    console.error("Error in postTexting:", error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {postTexting};
