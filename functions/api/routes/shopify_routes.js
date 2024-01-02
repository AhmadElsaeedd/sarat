const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const shopify_controller = require('../controllers/shopify_controller');

router.get('/', express.json(), shopify_controller.getShopify);
router.post('/', express.json(), shopify_controller.postShopify);
router.post('/AbandonedCartUsers', express.json(), shopify_controller.postShopifyAbandonedCarts);
router.get('/auth', express.json(), shopify_controller.handleAuthentication);
router.get('/auth/callback', express.json(), shopify_controller.handleAuthenticationCallback);


module.exports = router;
