const whatsapp_service = require('../services/whatsapp_service');
const stripe_service = require('../services/stripe_service');
const firebase_service = require('../services/firebase_service');
const shopify_service = require('../services/shopify_service');

const postTexting = async (req, res) => {
  try {
    console.log(req.body);
    // Required parameters
    const productName = req.body.productName;
    const shopify_productId = req.body.productId;
    const phoneNumber = req.body.phoneNumber;
    const shopDomain = req.body.shop;
    if (!productName || !phoneNumber || !shopDomain) {
      res.status(400).send('Missing required parameters');
    }
    // Optional parameters
    const messageType = req.body.messageType || null;
    const personName = req.body.personName || null;
    const productSize = req.body.productSize || null;
    // get the product id
    const stripe_productId = await stripe_service.get_product_id(productName);
    // Update the document to be able to track what's happening with product id and the shop that the user is conversing with
    await firebase_service.update_current_product(phoneNumber, stripe_productId, shopify_productId);
    await firebase_service.user_enter_conversation(phoneNumber, shopDomain);
    const access_token = await firebase_service.get_store_access_token(shopDomain);
    const images = await shopify_service.get_product_image(shopDomain, access_token, shopify_productId);
    // get the product image using product.images[0].src to find the product's image url
    // pass the product image into the sendMessage function
    // Call sendIntroMessage
    // await whatsapp_service.sendIntroMessage(phoneNumber, productName, personName, productSize, shopDomain);
    // if (messageType === null) {
    //   // await whatsapp_service.unifiedSendMessage(phoneNumber, null, productName, personName, productSize, null, null, null, null, "abandoned_cart_message");
    //   await whatsapp_service.sendMessage(phoneNumber, null, null, productName, personName, productSize, null, null, null, null, "abandoned_cart_message");
    // } else if (messageType != null && images.length > 0) {
    //   console.log("I am here 1");
    //   // await whatsapp_service.unifiedSendMessage(phoneNumber, null, productName, personName, productSize, null, null, null, null, messageType);
    //   await whatsapp_service.sendMessage(phoneNumber, images[0], productName, personName, productSize, null, null, null, null, messageType);
    // }

    if (!Array.isArray(images) || images.length === 0) {
      console.error("No images available or 'images' is not an array");
      // Handle the case where there are no images or 'images' is not an array
      // For example, you might want to send a message without an image or handle the error differently
    } else {
      // Proceed with the rest of the code
      if (messageType === null) {
        await whatsapp_service.sendMessage(phoneNumber, null, null, productName, personName, productSize, null, null, null, null, "abandoned_cart_message");
      } else if (messageType != null) {
        console.log("Message type is: ", messageType);
        await whatsapp_service.sendMessage(phoneNumber, images[0], null, productName, personName, productSize, null, null, null, null, messageType);
      }
    }

    res.status(200).send('EVENT RECEIVED');
  } catch (error) {
    console.error("Error in postTexting:", error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {postTexting};
