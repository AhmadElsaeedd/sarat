const firebase_service = require('../services/firebase_service');
const axios = require('axios');

async function get_brand_message_templates(shop) {
  const keys = await firebase_service.get_whatsapp_keys(shop);

  const url = `https://graph.facebook.com/v19.0/${keys.whatsapp_business_account_id}/message_templates?fields=name,status,components`;
  const headers = {
    'Authorization': `Bearer ${keys.whatsapp_access_token}`,
  };

  const response = await axios.get(url, {headers});

  return response.data.data;
}

async function create_message_template(shop) {
  const keys = await firebase_service.get_whatsapp_keys(shop);

  const url = `https://graph.facebook.com/v19.0/${keys.whatsapp_business_account_id}/message_templates`;

  const data = {
    "name": "intro_message",
    "category": "MARKETING",
    "language": "en_US",
    "components": [{
      "type": "BODY",
      "text": "Hi {{1}}👋 It's {{2}} from {{3}}. You left the {{4}} behind. I can add a {{5}}% discount if you checkout now, sounds good?\n\n📲 Text \"Yes\" to order for {{6}}{{7}} at a {{5}}% discount saving {{8}}{{7}}",
      "example": {
        "body_text": [
          [
            "Faizah", "Sarah", "Beesline", "whitening lift cream", "10", "199", "AED", "49",
          ],
        ],
      },
    },
    {
      "type": "FOOTER",
      "text": "Not interested? Tap Stop promotions",
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Stop promotions",
        },
      ],
    }],
  };

  const headers = {
    'Authorization': `Bearer ${keys.whatsapp_access_token}`,
  };

  let response;
  try {
    response = await axios.post(url, data, headers);
  } catch (error) {
    if (error.response) {
      console.error('Whatsapp error response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }

  return response.data;
}

module.exports = {get_brand_message_templates, create_message_template};
