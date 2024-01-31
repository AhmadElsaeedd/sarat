const whatsapp_service = require('../services/whatsapp_service');
const stripe_service = require('../services/stripe_service');
const firebase_service = require('../services/firebase_service');
const shopify_service = require('../services/shopify_service');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const postSendMessageToMass = async (req, res) => {
  try {
    // The three parameters that are passed to the endpoint
    const shopDomain = req.body.shop;
    const selected_people = req.body.selectedPeople;

    const length = req.body.selectedPeople.length;

    for (let i = 0; i < length; i++) {
      const productList = selected_people[i].product_list;
      const personName = selected_people[i].customer_name;
      const phoneNumber = selected_people[i].customer_phone;
      const checkoutStartedAt = selected_people[i].checkout_started_at;
      const cohort = selected_people[i].cohort;
      const presentment_currency = selected_people[i].customer_currency;

      const productListWithStripeIds = await stripe_service.get_product_ids(productList, shopDomain);
      // const productListWithPrices = await stripe_service.get_product_prices(productListWithStripeIds, shopDomain);
      const access_token = await firebase_service.get_store_access_token(shopDomain);
      // const productsListWithImages = await shopify_service.get_product_images(shopDomain, access_token, productListWithPrices);
      const productsListWithImages = await shopify_service.get_product_images(shopDomain, access_token, productListWithStripeIds);
      // Update the document to be able to track what's happening with product id and the shop that the user is conversing with
      await firebase_service.start_conversation(phoneNumber, shopDomain, productsListWithImages);
      await whatsapp_service.sendMessageToCohortCustomer(shopDomain, phoneNumber, personName, cohort, productsListWithImages, checkoutStartedAt, presentment_currency);
      await delay(500);
    }

    res.status(200).send('EVENTS RECEIVED');
  } catch (error) {
    console.error("Error in postSendMessageToMass:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postTexting = async (req, res) => {
  try {
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
    const stripe_productId = await stripe_service.get_product_id(productName, shopDomain);
    // Update the document to be able to track what's happening with product id and the shop that the user is conversing with
    await firebase_service.update_current_product(phoneNumber, stripe_productId, shopify_productId);
    await firebase_service.user_enter_conversation(phoneNumber, shopDomain);
    const access_token = await firebase_service.get_store_access_token(shopDomain);
    const images = await shopify_service.get_product_image(shopDomain, access_token, shopify_productId);

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

const postTextingSendMessage = async (req, res) => {
  try {
    // Required parameters
    const phoneNumber = req.body.phoneNumber;
    const messageContent = req.body.messageContent;
    const shopDomain = req.body.shop;
    if (!messageContent || !phoneNumber || !shopDomain) {
      res.status(400).send('Missing required parameters');
    }
    await firebase_service.user_enter_conversation(phoneNumber, shopDomain);

    await whatsapp_service.sendMessage(phoneNumber, null, messageContent, null, null, null, null, null, null, null, "user_generated");

    res.status(200).send('EVENT RECEIVED');
  } catch (error) {
    console.error("Error in postTexting:", error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {postTexting, postSendMessageToMass, postTextingSendMessage};
