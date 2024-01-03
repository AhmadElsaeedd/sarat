const whatsapp_service = require('../services/whatsapp_service');
const stripe_service = require('../services/stripe_service');
const firebase_service = require('../services/firebase_service');

const postTexting = async (req, res) => {
  try {
    // Required parameters
    const productName = req.body.productName;
    const phoneNumber = req.body.phoneNumber;
    const shopDomain = req.body.shop;
    if (!productName || !phoneNumber || !shopDomain) {
      res.status(400).send('Missing required parameters');
    }
    // Optional parameters
    const personName = req.body.personName || null;
    const productSize = req.body.productSize || null;
    // get the product id
    const productId = await stripe_service.get_product_id(productName);
    // Update the document to be able to track what's happening
    await firebase_service.update_current_product(phoneNumber, productId);
    // Call sendIntroMessage
    await whatsapp_service.sendIntroMessage(phoneNumber, productName, personName, productSize);
    res.status(200).send('EVENT RECEIVED');
  } catch (error) {
    console.error("Error in postTexting:", error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {postTexting};
