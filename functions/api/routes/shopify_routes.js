const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {getShopify, postShopify} = require('../controllers/shopify_controller');

router.get('/', express.json(), getShopify);
router.post('/', express.json(), postShopify);

module.exports = router;
