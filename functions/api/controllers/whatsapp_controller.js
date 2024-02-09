const whatsapp_manager_service = require('../services/whatsapp_manager_service.js');

const GetMessageTemplates = async (req, res) => {
  try {
    const shop = req.body.shop;

    const brand_message_templates = await whatsapp_manager_service.get_brand_message_templates(shop);

    res.status(200).send(brand_message_templates);
  } catch (error) {
    console.error("Error in GetMessageTemplates:", error);
    res.status(500).send('Internal Server Error');
  }
};

const CreateMessageTemplate = async (req, res) => {
  try {
    const shop = req.body.shop;

    const creation_response = await whatsapp_manager_service.create_message_template(shop);

    res.status(200).send(creation_response);
  } catch (error) {
    console.error("Error in CreateMessageTemplates:", error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {GetMessageTemplates, CreateMessageTemplate};
