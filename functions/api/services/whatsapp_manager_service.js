const firebase_service = require('../services/firebase_service');
const axios = require('axios');
const crypto = require('crypto');

async function get_brand_message_templates(shop, message_template_ids) {
  const keys = await firebase_service.get_whatsapp_keys(shop);

  const headers = {
    'Authorization': `Bearer ${keys.whatsapp_access_token}`,
  };

  const messages_with_content = [];
  for (const message of message_template_ids) {
    const intro_message1_id = message.intro_message1.id;
    const intro_message2_id = message.intro_message2.id;

    const url1 = `https://graph.facebook.com/v19.0/${intro_message1_id}?access_token=${keys.whatsapp_access_token}`;
    const url2 = `https://graph.facebook.com/v19.0/${intro_message2_id}?access_token=${keys.whatsapp_access_token}`;

    const response1 = await axios.get(url1, {headers});
    const response2 = await axios.get(url2, {headers});

    message.intro_message1.content = response1.data.components;
    message.intro_message2.content = response2.data.components;

    messages_with_content.push(message);
  }

  return messages_with_content;
}

function createHash(input) {
  return crypto.createHash('md5').update(input).digest('hex').substring(0, 4);
}

async function create_message_templates(shop, segment_number) {
  const keys = await firebase_service.get_whatsapp_keys(shop);
  const url = `https://graph.facebook.com/v19.0/${keys.whatsapp_business_account_id}/message_templates`;
  const headers = {
    'Authorization': `Bearer ${keys.whatsapp_access_token}`,
  };

  const responses = [];
  for (let iteration_number = 1; iteration_number <= 2; iteration_number++) {
    const uniqueId = createHash(shop + segment_number);
    const data = {
      "name": `intro_message${iteration_number}_segment${segment_number}_uid${uniqueId}`,
      "category": "MARKETING",
      "language": "en_US",
      "components": [
        {
          "type": "HEADER",
          "format": "IMAGE",
          "example": {
            "header_handle": [
            // file handle here from the resumable API
              "4::aW1hZ2UvanBn:ARZ-U8u7pabJA-3s__BxLqOterhWXXR30-QrqGtopgTM2KqydsCCyRNk0lRDBbXFBR8QRPaiY0m7iDqfj4OiDzShydNd4eZjp14AU-GwoXAfaw:e:1707826616:834177964858133:61552296369370:ARZHHa4LCgulCQPQ4mU\n4::aW1hZ2UvanBn:ARY_Nkkg1957assHKcCjOo-e-OqlDiw2qyqRr_jEASS5Lqo5eYwdpY3XFwZW-hjODLYIV_qaVgz0_2kAE9NPgLqZsaiRcddbsCWG-uahAajmYA:e:1707826616:834177964858133:61552296369370:ARawDpm176-76T1JUcE\n4::aW1hZ2UvanBn:ARaSeIDKd_8WvXxwAEd0aQtT0azOtn-RmUuhFE228psrIeQFumzal4Xwy8y8rsInBxKvMFLZG8mBvEDrCbuyGw2crE5uTdXF4mz9Xqfsl1SQXQ:e:1707826617:834177964858133:61552296369370:ARYNYwAzOwPeLRbqTxQ\n4::aW1hZ2UvanBn:ARZUDPmBQpEH4eP9I_sKH3pUF4rPkYcHO5xcb8ByhIzZi6mXAZleLX-pNx7gkypAyPIwGEm45k4GjlzinMj_GUdm9x0zkl61X3CchCIABjNsrw:e:1707826617:834177964858133:61552296369370:ARZqpnZ1pDv65gW03IU\n4::aW1hZ2UvanBn:ARbn9L7e8RgQ8uItI-qXuIXnzPcawwaE34xvu1dWV1UQE64WDvKyer0vTvfB-sjEyZ5w4qtsKYx68ZpavbDfKNPa9BqkujVkWHRrXzWyUPaDzA:e:1707826617:834177964858133:61552296369370:ARYQLu5trcEKsqiVLJg",
            ],
          },
        },
        {
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
        //   {
        //     "type": "FOOTER",
        //     "text": "Not interested? Tap Stop promotions",
        //   }
      ],
    };

    try {
      const response = await axios.post(url, data, {headers: headers});
      responses.push(response.data);
    } catch (error) {
      if (error.response) {
        console.error('Whatsapp error response:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    }
  }

  return responses;
}

module.exports = {get_brand_message_templates, create_message_templates};
