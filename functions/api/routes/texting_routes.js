const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {postTexting} = require('../controllers/texting_controller');

router.post('/', postTexting);

module.exports = router;
