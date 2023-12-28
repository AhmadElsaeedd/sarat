const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {postStripe} = require('../controllers/stripe_controller');

router.post('/', express.raw({type: 'application/json'}), postStripe);

module.exports = router;
