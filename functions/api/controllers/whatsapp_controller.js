const whatsapp_manager_service = require('../services/whatsapp_manager_service.js');
const firebase_service = require('../services/firebase_service.js');

const GetMessageTemplates = async (req, res) => {
  try {
    const shop = req.body.shop;

    const message_template_ids = await firebase_service.get_message_template_ids(shop);

    const brand_message_templates = await whatsapp_manager_service.get_brand_message_templates(shop, message_template_ids);

    res.status(200).send(brand_message_templates);
  } catch (error) {
    console.error("Error in GetMessageTemplates:", error);
    res.status(500).send('Internal Server Error');
  }
};

const CreateMessageTemplate = async (req, res) => {
  try {
    const shop = req.body.shop;
    const segment_number = req.body.segment_number;
    const segment_id = req.body.segment_id;

    const creation_response = await whatsapp_manager_service.create_message_templates(shop, segment_number);

    await firebase_service.set_new_message_templates(shop, creation_response, segment_id);

    res.status(200).send(creation_response);
  } catch (error) {
    console.error("Error in CreateMessageTemplates:", error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {GetMessageTemplates, CreateMessageTemplate};
