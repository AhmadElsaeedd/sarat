const axios = require('axios');
const firebase_service = require('../services/firebase_service');
const shopify_service = require('../services/shopify_service');
const shopifyApiKey = "ef3aa22bb5224ece6ac31306731ff62d";
const shopifyApiSecret = "44095502e2626466960c924e4af35e7e";
const scopes = 'read_products,write_orders'; // Comma-separated list of scopes
const redirectUri = 'https://us-central1-textlet-test.cloudfunctions.net/webhook/shopify/auth/callback';

const handleAuthentication = async (req, res) => {
  console.log("I am here mate");
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
    console.log("Response is: ", response.data);
    const accessToken = response.data.access_token;
    // TODO: Save the access token to your database associated with the shop
    console.log(`Access token for shop ${shop} is ${accessToken}`);
    await firebase_service.save_store_access_token(shop, accessToken);

    // Redirect the user to your app with the token or set the token in session
    res.status(200).send('Authentication successful. Check logs for the access token.');
  } catch (error) {
    res.status(500).send('Error during OAuth callback');
  }
};

const getShopify = (req, res) => {

};

const postShopify = async (req, res) => {
  try {
    // We can make this post endpoint with only 1 required parameter, specifiying the type of request to make to shopify

    // Then some optional parameters to specify what we need from the endpoint in shopify, exactly the query maybe

    // Then in the service code, we could make the api requests from shopofy with the parameters

    // Then, return the results of this post request in the database

    res.status(200).send('EVENT RECEIVED');
  } catch (error) {
    console.error("Error in postShopify:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postShopifyAbandonedCarts = async (req, res) => {
  try {
    // This endpoint will just return all the users with abandoned carts
    const shop = req.body.shop;
    const access_token = await firebase_service.get_store_access_token(shop);
    console.log("Access token is: ", access_token);
    const abandoned_carts = await shopify_service.get_abandoned_orders(shop, access_token);
    console.log("Abandoned carts are: ", abandoned_carts);

    // Then, return the results of this post request in the database

    res.status(200).send('EVENT RECEIVED');
  } catch (error) {
    console.error("Error in postShopifyAbandonedCarts:", error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {getShopify, postShopify, postShopifyAbandonedCarts, handleAuthentication, handleAuthenticationCallback};
