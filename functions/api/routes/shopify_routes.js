const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const shopify_controller = require('../controllers/shopify_controller');

router.post('/PostAbandonedCartsFlow', express.json(), shopify_controller.postShopifyAbandonedCartsFlow);
router.post('/AbandonedCartUsers', express.json(), shopify_controller.postShopifyAbandonedCarts);
router.post('/GetAbandonedCartsFirstReminder', express.json(), shopify_controller.postShopifyAbandonedCartsFirstReminder);
router.post('/GetProductsForRefillAfterField', express.json(), shopify_controller.postShopifyGetProductsForRefillAfterField);
router.post('/UpdateProductsWithRefillAfter', express.json(), shopify_controller.postShopifyAddRefillAfterFieldToProduct);
router.post('/GetProduct', express.json(), shopify_controller.postGetProductByID);
router.post('/GetRefillCustomers', express.json(), shopify_controller.postShopifyRefillCustomers);
router.post('/OnboardBrand', express.json(), shopify_controller.postShopifyOnboardBrand);
router.post('/GetAllCustomers', express.json(), shopify_controller.postShopifyAllCustomers);
router.post('/CartCreatedWebhook', express.json(), shopify_controller.postCartCreatedWebhook);
router.post('/CheckoutCreatedWebhook', express.json(), shopify_controller.postCheckoutCreatedWebhook);
router.get('/auth', express.json(), shopify_controller.handleAuthentication);
router.get('/auth/callback', express.json(), shopify_controller.handleAuthenticationCallback);


module.exports = router;
