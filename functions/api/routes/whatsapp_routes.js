const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const whatsapp_controller = require('../controllers/whatsapp_controller');

router.post('/GetMessageTemplates', express.json(), whatsapp_controller.GetMessageTemplates);
router.post('/CreateMessageTemplate', express.json(), whatsapp_controller.CreateMessageTemplate);
router.post('/EditMessageTemplate', express.json(), whatsapp_controller.EditMessageTemplate);


module.exports = router;
