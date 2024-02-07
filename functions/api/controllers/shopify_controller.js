const axios = require('axios');
const firebase_service = require('../services/firebase_service');
const shopify_service = require('../services/shopify_service');
const stripe_service = require('../services/stripe_service');
const cohort_service = require('../services/cohort_service');
// const {access} = require('fs');
const shopifyApiKey = "ef3aa22bb5224ece6ac31306731ff62d";
const shopifyApiSecret = "44095502e2626466960c924e4af35e7e";
const scopes = 'read_products,write_orders, read_orders, read_customers,read_inventory, write_products,read_script_tags, write_script_tags';
const redirectUri = 'https://us-central1-textlet-test.cloudfunctions.net/webhook/shopify/auth/callback';

const handleAuthentication = async (req, res) => {
  const shop = req.query.shop;
  if (shop) {
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${shopifyApiKey}&scope=${scopes}&redirect_uri=${redirectUri}`;
    res.redirect(authUrl);
  } else {
    return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
  }
};

const handleAuthenticationCallback = async (req, res) => {
  const {shop, code} = req.query;
  const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
  const accessTokenPayload = {
    client_id: shopifyApiKey,
    client_secret: shopifyApiSecret,
    code,
  };

  try {
    const response = await axios.post(accessTokenRequestUrl, accessTokenPayload);
    const accessToken = response.data.access_token;
    const shopData = await shopify_service.get_store_configuration(shop, accessToken);
    console.log(`Access token for shop ${shop} is ${accessToken}`);
    console.log("Shop data is: ", shopData);
    await firebase_service.save_store_data(shop, accessToken, shopData);
    await shopify_service.subscribe_to_cart_creation(shop, accessToken);
    await shopify_service.subscribe_to_cart_update(shop, accessToken);
    await shopify_service.subscribe_to_checkout_creation(shop, accessToken);
    if (shop!="21stitches-co-8829.myshopify.com") {
      await shopify_service.attach_script(shop, accessToken);
    }

    // Redirect the user to your app with the token or set the token in session
    const redirectUrl = 'https://textlet0.retool.com/apps/4f1c9cfc-aaf6-11ee-8409-77d5b96375e9/Authentication%20flow';
    res.redirect(redirectUrl);
  } catch (error) {
    res.status(500).send('Error during OAuth callback');
  }
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const postShopifyOnboardBrand = async (req, res) => {
  try {
    const shop = req.body.shop;
    const access_token = await firebase_service.get_store_access_token(shop);
    const store_currency = await firebase_service.get_store_currency(shop);

    const products = await shopify_service.get_product_names_and_prices(shop, access_token);

    for (const product of products) {
      const price = product.variants[0].price;
      const title = product.title;
      const id = product.id;
      await stripe_service.createProductAndPrice(title, id, price, store_currency, shop);
      await delay(500); // Delay of 1 second (1000 milliseconds) between each API call
    }


    res.status(200).send(products);
  } catch (error) {
    console.error("Error in postShopifyOnboardBrand:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postShopifyAbandonedCartsFlow = async (req, res) => {
  try {
    // This endpoint will send messages to all customers who left an abandoned checkout or cart based on what cohort they fall in
    const shop = req.body.shop;
    const access_token = await firebase_service.get_store_access_token(shop);

    // Gets all abandoned checkouts that haven't been completed
    const abandoned_uncompleted_checkouts = await shopify_service.get_abandoned_orders(shop, access_token);

    // Gets all abandoned carts that have a phone number
    const abandoned_carts = await firebase_service.get_abandoned_carts(shop);
    console.log("Length of abandoned carts: ", abandoned_carts.length);

    // Get all the last orders made by the customers (if they have ordered before)
    const orders = await shopify_service.get_last_orders_of_customers_who_have_abandoned_checkouts(shop, access_token, abandoned_uncompleted_checkouts);

    // Now combine the "orders" array with the abandoned checkout and assign the .created_at property of it to last_order_date in the customer of the abandoned checkout
    const abandoned_checkouts_with_last_order = await cohort_service.combine_orders_with_abandoned_checkouts(abandoned_uncompleted_checkouts, orders);
    // Give this variable in the get_customers_with_cohorts function instead of the variable before

    // Get all the cohorts in the brand
    const cohorts = await firebase_service.get_cohorts(shop);

    // Combine abandoned carts and abandoned checkouts in the same array
    const abandoned_everything = await cohort_service.combine_both_arrays(abandoned_checkouts_with_last_order, abandoned_carts);

    // ToDo: INCLUDE SEGMENTATION BASED ON CART OR CHECKOUT INSIDE THIS FUNCTION
    // Assign each checkout to a cohort and get all the needed details with also first reminder/second reminder
    const abandoned_everything_with_cohorts = await cohort_service.get_customers_with_cohorts(abandoned_everything, cohorts);
    // ToDo: CHANGE THE NAME OF THIS TO ABANDONED_EVERYTHING WITH COHORTS AND PASS IT INTO STRUCTURE DATA FOR MESSAGING

    // Get the data that we need from the above array
    // We need: shopify_productNames (array), shopify_productIds (array), phoneNumber, customer name
    // const structured_data = await cohort_service.structure_data_for_messaging(abandoned_checkouts_with_cohorts, shop);

    // Based on each customer's cohort and the time that they're in, send them the message that they should receive
    // await cohort_service.send_messages(access_token, shop, structured_data);

    // I don't think we should return anything here, we could just return success
    // res.status(200).send('Abandoned Carts Flow Done!');
    res.status(200).send(abandoned_everything_with_cohorts);
  } catch (error) {
    console.error("Error in postShopifyAbandonedCartsFlow:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postCartCreatedWebhook = async (req, res) => {
  try {
    // This endpoint will receive cart creation events from the webhook and store them as is in our firestore
    // Cart has been created, intercept the payload
    const payload = req.body;
    const shopDomain = req.get('X-Shopify-Shop-Domain'); // This gets the Shopify shop domain

    await firebase_service.update_cart(shopDomain, payload);

    console.log(`Webhook received from: ${shopDomain}`);

    res.status(200).send('Cart creation webhook payload received');
  } catch (error) {
    console.error("Error in postCartCreatedWebhook:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postCartUpdatedWebhook = async (req, res) => {
  try {
    // This endpoint will receive cart update events from the webhook and store them as is in our firestore
    const payload = req.body;
    const shopDomain = req.get('X-Shopify-Shop-Domain'); // This gets the Shopify shop domain

    await firebase_service.update_cart(shopDomain, payload);

    console.log(`Webhook received from: ${shopDomain}`);

    res.status(200).send('Cart update webhook payload received');
  } catch (error) {
    console.error("Error in postCartCreatedWebhook:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postCheckoutCreatedWebhook = async (req, res) => {
  try {
    // This endpoint will receive checkout creation events from the webhook and delete the carts that are related to them
    // Checkout has been created, intercept the payload
    const payload = req.body;
    const shopDomain = req.get('X-Shopify-Shop-Domain'); // This gets the Shopify shop domain

    await firebase_service.delete_carts(shopDomain, payload);

    console.log(`Webhook received from: ${shopDomain}`);

    res.status(200).send('Checkout creation webhook payload received');
  } catch (error) {
    console.error("Error in postCheckoutCreatedWebhook:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postShopifyAbandonedCarts = async (req, res) => {
  try {
    // This endpoint will just return all the users with abandoned carts
    const shop = req.body.shop;
    const access_token = await firebase_service.get_store_access_token(shop);
    const abandoned_carts = await shopify_service.get_abandoned_orders(shop, access_token);

    res.status(200).send(abandoned_carts);
  } catch (error) {
    console.error("Error in postShopifyAbandonedCarts:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postShopifyAbandonedCartsFirstReminder = async (req, res) => {
  try {
    // This endpoint will just return all the users with abandoned carts
    const shop = req.body.shop;
    const access_token = await firebase_service.get_store_access_token(shop);
    const abandoned_carts = await shopify_service.get_abandoned_orders_first_reminder(shop, access_token);

    res.status(200).send(abandoned_carts);
  } catch (error) {
    console.error("Error in postShopifyAbandonedCartsFirstReminder:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postShopifyRefillCustomers = async (req, res) => {
  try {
    // This endpoint will just return all the users that must refill their product
    const shop = req.body.shop;
    const access_token = await firebase_service.get_store_access_token(shop);

    // Get all the products with their ids and refill_after field
    const products = await shopify_service.get_products_for_refill_feature(shop, access_token);

    // Get all the customers who have more than 1 order already
    const customer_ids = await shopify_service.get_customer_ids_for_refill_feature(shop, access_token);

    const customers_who_need_refill = await shopify_service.get_customers_who_need_refill(shop, access_token, products, customer_ids);

    res.status(200).send(customers_who_need_refill);
  } catch (error) {
    console.error("Error in postShopifyRestock:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postShopifyGetProductsForRefillAfterField = async (req, res) => {
  try {
    // This endpoint will just return all the users that must refill their product
    const shop = req.body.shop;
    const access_token = await firebase_service.get_store_access_token(shop);

    const products = await shopify_service.get_products_for_refill_feature(shop, access_token);

    res.status(200).send(products);
  } catch (error) {
    console.error("Error in postShopifyGetProductsForRefillAfterField:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postShopifyAddRefillAfterFieldToProduct = async (req, res) => {
  try {
    // This endpoint will just return all the users that must refill their product
    const shop = req.body.shop;
    const products = req.body.products;
    const access_token = await firebase_service.get_store_access_token(shop);

    await shopify_service.update_products_with_refill_field(shop, access_token, products);


    res.status(200).send('EVENT RECEIVED');
  } catch (error) {
    console.error("Error in postShopifyAddRefillAfterFieldToProduct:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postGetProductByID = async (req, res) => {
  try {
    // This endpoint will just return all the users that must refill their product
    const shop = req.body.shop;
    const product_id = req.body.product_id;
    const access_token = await firebase_service.get_store_access_token(shop);

    const product = await shopify_service.get_product(shop, access_token, product_id);

    console.log("This is the product now: ", product);

    res.status(200).send('EVENT RECEIVED');
  } catch (error) {
    console.error("Error in postShopifyAddRefillAfterFieldToProduct:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postShopifyAllCustomers = async (req, res) => {
  try {
    // This endpoint will just return all the users that must refill their product
    const shop = req.body.shop;
    const access_token = await firebase_service.get_store_access_token(shop);

    // Get all the customers who have a phone number
    const customers = await shopify_service.get_customers_for_product_launches(shop, access_token);

    res.status(200).send(customers);
  } catch (error) {
    console.error("Error in postShopifyAllCustomers:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {postShopifyAbandonedCarts, handleAuthentication, handleAuthenticationCallback, postCartCreatedWebhook, postCartUpdatedWebhook, postShopifyRefillCustomers, postShopifyGetProductsForRefillAfterField, postShopifyAddRefillAfterFieldToProduct, postGetProductByID, postShopifyOnboardBrand, postShopifyAllCustomers, postShopifyAbandonedCartsFirstReminder, postShopifyAbandonedCartsFlow, postCheckoutCreatedWebhook};
