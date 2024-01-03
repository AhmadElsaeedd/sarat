const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {postFirebaseUpdateMessageTemplate, postFirebaseGetMessageTemplate} = require('../controllers/firebase_controller');

router.post('/UpdateMessageTemplate', express.raw({type: 'application/json'}), postFirebaseUpdateMessageTemplate);
router.post('/GetMessageTemplate', express.raw({type: 'application/json'}), postFirebaseGetMessageTemplate);

module.exports = router;
