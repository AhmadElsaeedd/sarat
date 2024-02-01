const axios = require('axios');
const firebase_service = require('../services/firebase_service');
const shopify_service = require('../services/shopify_service');
const stripe_service = require('../services/stripe_service');
const cohort_service = require('../services/cohort_service');
const shopifyApiKey = "ef3aa22bb5224ece6ac31306731ff62d";
const shopifyApiSecret = "44095502e2626466960c924e4af35e7e";
const scopes = 'read_products,write_orders, read_orders, read_customers,read_inventory, write_products';
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
    // This endpoint will send messages to all customers who left an abandoned cart based on what cohort they fall in
    const shop = req.body.shop;
    const access_token = await firebase_service.get_store_access_token(shop);

    // Gets all abandoned checkouts that haven't been completed
    const abandoned_uncompleted_checkouts = await shopify_service.get_abandoned_orders(shop, access_token);

    // Get all the cohorts in the brand
    const cohorts = await firebase_service.get_cohorts(shop);

    // Assign each checkout to a cohort and get all the needed details with also first reminder/second reminder
    const abandoned_checkouts_with_cohorts = await cohort_service.get_customers_with_cohorts(abandoned_uncompleted_checkouts, cohorts);

    // Get the data that we need from the above array
    // We need: shopify_productNames (array), shopify_productIds (array), phoneNumber, customer name
    const structured_data = await cohort_service.structure_data_for_messaging(abandoned_checkouts_with_cohorts, shop);

    // Based on each customer's cohort and the time that they're in, send them the message that they should receive
    await cohort_service.send_messages(access_token, shop, structured_data);

    // I don't think we should return anything here, we could just return success
    res.status(200).send('Abandoned Carts Flow Done!');
    // res.status(200).send(structured_data);
  } catch (error) {
    console.error("Error in postShopifyAbandonedCartsFlow:", error);
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

module.exports = {postShopifyAbandonedCarts, handleAuthentication, handleAuthenticationCallback, postShopifyRefillCustomers, postShopifyGetProductsForRefillAfterField, postShopifyAddRefillAfterFieldToProduct, postGetProductByID, postShopifyOnboardBrand, postShopifyAllCustomers, postShopifyAbandonedCartsFirstReminder, postShopifyAbandonedCartsFlow};
