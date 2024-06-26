const whatsapp_manager_service = require('../services/whatsapp_manager_service.js');
const firebase_service = require('../services/firebase_service.js');

const OnboardClient = async (req, res) => {
  try {
    const code = req.body.code;
    const shopify_domain = req.body.shopify_domain;

    // get the access token
    const access_token = await whatsapp_manager_service.get_access_token(code);

    // ToDo: get the WABA ID and the phone number ID from whatsapp
    const waba = await whatsapp_manager_service.get_waba(access_token);
    const phone_number = await whatsapp_manager_service.get_phone_number(access_token, waba.id);

    await whatsapp_manager_service.register_phone_number(access_token, phone_number.id);

    await whatsapp_manager_service.subscribe_to_webhooks(access_token, waba.id);

    // store the access token in the shopify's firestore
    await firebase_service.set_whatsapp_details(shopify_domain, access_token, waba, phone_number);

    res.status(200).json({message: 'Successfully onboarded'});
  } catch (error) {
    console.error("Error in OnboardClient:", error);
    res.status(500).send('Internal Server Error');
  }
};

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


    console.log("segment number is: ", segment_number);
    console.log("Segment id is: ", segment_id);

    const creation_response = await whatsapp_manager_service.create_message_templates(shop, segment_number);

    await firebase_service.set_new_message_templates(shop, creation_response, segment_id);

    res.status(200).send(creation_response);
  } catch (error) {
    console.error("Error in CreateMessageTemplates:", error);
    res.status(500).send('Internal Server Error');
  }
};

const EditMessageTemplate = async (req, res) => {
  try {
    const shop = req.body.shop;
    const message_template_id = req.body.message_template_id;
    const content = req.body.content;

    const edit_response = await whatsapp_manager_service.edit_message_template(shop, message_template_id, content);

    await firebase_service.update_whatsapp_message_template(shop, message_template_id, content);

    res.status(200).send(edit_response);
  } catch (error) {
    console.error("Error in EditMessageTemplate:", error);
    res.status(500).send('Internal Server Error');
  }
};

const DeleteMessageTemplates = async (req, res) => {
  try {
    const shop = req.body.shop;
    const document_id = req.body.document_id;

    const message_template_names = await firebase_service.get_message_template_names_of_segment(shop, document_id);

    const deletion_response = await whatsapp_manager_service.delete_message_templates(shop, message_template_names);

    res.status(200).send(deletion_response);
  } catch (error) {
    console.error("Error in DeleteMessageTemplates:", error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {OnboardClient, GetMessageTemplates, CreateMessageTemplate, EditMessageTemplate, DeleteMessageTemplates};
