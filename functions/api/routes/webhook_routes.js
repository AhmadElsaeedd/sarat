const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {getWebhook, postWebhook} = require('../controllers/webhook_controller');

router.get('/', getWebhook);
router.post('/', postWebhook);

module.exports = router;
