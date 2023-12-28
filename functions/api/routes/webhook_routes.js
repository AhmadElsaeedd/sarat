const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {getWebhook, postWebhook} = require('../controllers/webhook_controller');

router.get('/', express.json(), getWebhook);
router.post('/', express.json(), postWebhook);

module.exports = router;
