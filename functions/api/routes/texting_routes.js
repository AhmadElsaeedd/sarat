const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {postTexting, postTextingSendMessage, postSendMessageToMass} = require('../controllers/texting_controller');

router.post('/', express.json(), postTexting);
router.post('/SendMessagesToMass', express.json(), postSendMessageToMass);
router.post('/SendMessagesToIndividual', express.json(), postTextingSendMessage);

module.exports = router;
