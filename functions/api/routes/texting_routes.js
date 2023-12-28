const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {postTexting} = require('../controllers/texting_controller');

router.post('/', express.json(), postTexting);

module.exports = router;
