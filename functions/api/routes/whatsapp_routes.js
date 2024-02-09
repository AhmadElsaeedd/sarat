const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const whatsapp_controller = require('../controllers/whatsapp_controller');

router.post('/GetMessageTemplates', express.json(), whatsapp_controller.GetMessageTemplates);
router.post('/CreateMessageTemplate', express.json(), whatsapp_controller.CreateMessageTemplate);


module.exports = router;
