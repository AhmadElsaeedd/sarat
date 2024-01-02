require('@shopify/shopify-api/adapters/node');

const {shopifyApi, LATEST_API_VERSION, Shopify} = require('@shopify/shopify-api');

const shopify = shopifyApi({
  // The next 4 values are typically read from environment variables for added security
  apiKey: "ef3aa22bb5224ece6ac31306731ff62d",
  apiSecretKey: "44095502e2626466960c924e4af35e7e",
  scopes: ['read_products', 'read_customers'],
  isEmbeddedApp: false,
  hostName: "https://textlet0.retool.com/apps/6bfe02fa-a7c4-11ee-bc9e-37095146c11a/Textlet%20dashboard",
  apiVersion: LATEST_API_VERSION, // Use the latest API version
});

async function get_abandoned_orders(shop, access_token) {
  const session = new Shopify.Session.Session(shop, access_token);
  const client = new shopify.clients.Rest({session});
  console.log("client is: ", client);
}

module.exports = {get_abandoned_orders};
