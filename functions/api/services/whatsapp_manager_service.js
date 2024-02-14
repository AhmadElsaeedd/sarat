const firebase_service = require('../services/firebase_service');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

async function create_session(access_token, filePath) {
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats.size;
  const url = `https://graph.facebook.com/v19.0/834177964858133/uploads?file_length=${fileSizeInBytes}&file_type=image/jpg&access_token=${access_token}`;

  let response;
  try {
    response = await axios.post(url);
  } catch (error) {
    if (error.response) {
      console.error('Whatsapp error response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
  return response.data;
}

async function downloadImage(imageUrl) {
  const response = await axios({
    url: imageUrl,
    method: 'GET',
    responseType: 'stream',
  });

  const tempFilePath = path.join(os.tmpdir(), 'tempImage.jpg');
  const writer = fs.createWriteStream(tempFilePath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(tempFilePath));
    writer.on('error', reject);
  });
}

async function uploadImage(uploadSessionId, accessToken, filePath) {
  const url = `https://graph.facebook.com/v19.0/${uploadSessionId}`;
  const fileData = fs.readFileSync(filePath);

  try {
    const response = await axios({
      method: 'post',
      url: url,
      headers: {
        'Authorization': `OAuth ${accessToken}`,
        'file_offset': '0',
        'Content-Type': 'application/octet-stream',
      },
      // data: fileStream,
      data: fileData,
    });

    return response.data;
  } catch (error) {
    console.error(error);
    console.error(error.response.data);
    throw error; // Propagate the error up
  }
}

async function initiate_upload(access_token, session_id, filePath) {
  let response;
  try {
    response = await uploadImage(session_id, access_token, filePath);
  } catch (error) {
    console.error('Error uploading image:', error);
  }

  return response;
}

async function create_message_templates(shop, segment_number) {
  const keys = await firebase_service.get_whatsapp_keys(shop);
  const imageUrl = 'https://cdn.shopify.com/s/files/1/0676/9600/1322/files/NOR4161.jpg?v=1704811249';
  const filePath = await downloadImage(imageUrl);
  const session_id = await create_session(keys.whatsapp_access_token, filePath);
  const file_handle = await initiate_upload(keys.whatsapp_access_token, session_id.id, filePath);
  const url = `https://graph.facebook.com/v19.0/${keys.whatsapp_business_account_id}/message_templates`;
  const headers = {
    'Authorization': `Bearer ${keys.whatsapp_access_token}`,
  };

  const responses = [];
  for (let iteration_number = 1; iteration_number <= 2; iteration_number++) {
    const uniqueId = createHash(shop + segment_number);
    const name = `intro_message${iteration_number}_segment${segment_number}_uid${uniqueId}`;
    const text = "Hi {{1}}👋 It's {{2}} from {{3}}. You left the {{4}} behind. I can add a {{5}}% discount if you checkout now, sounds good?\n\n📲 Text \"Yes\" to order for {{6}}{{7}} at a {{5}}% discount saving {{8}}{{7}}";
    const data = {
      "name": name,
      "category": "MARKETING",
      "language": "en_US",
      "components": [
        {
          "type": "HEADER",
          "format": "IMAGE",
          "example": {
            "header_handle": [
            // file handle here from the resumable API
              // "4::aW1hZ2UvanBn:ARZ-U8u7pabJA-3s__BxLqOterhWXXR30-QrqGtopgTM2KqydsCCyRNk0lRDBbXFBR8QRPaiY0m7iDqfj4OiDzShydNd4eZjp14AU-GwoXAfaw:e:1707826616:834177964858133:61552296369370:ARZHHa4LCgulCQPQ4mU\n4::aW1hZ2UvanBn:ARY_Nkkg1957assHKcCjOo-e-OqlDiw2qyqRr_jEASS5Lqo5eYwdpY3XFwZW-hjODLYIV_qaVgz0_2kAE9NPgLqZsaiRcddbsCWG-uahAajmYA:e:1707826616:834177964858133:61552296369370:ARawDpm176-76T1JUcE\n4::aW1hZ2UvanBn:ARaSeIDKd_8WvXxwAEd0aQtT0azOtn-RmUuhFE228psrIeQFumzal4Xwy8y8rsInBxKvMFLZG8mBvEDrCbuyGw2crE5uTdXF4mz9Xqfsl1SQXQ:e:1707826617:834177964858133:61552296369370:ARYNYwAzOwPeLRbqTxQ\n4::aW1hZ2UvanBn:ARZUDPmBQpEH4eP9I_sKH3pUF4rPkYcHO5xcb8ByhIzZi6mXAZleLX-pNx7gkypAyPIwGEm45k4GjlzinMj_GUdm9x0zkl61X3CchCIABjNsrw:e:1707826617:834177964858133:61552296369370:ARZqpnZ1pDv65gW03IU\n4::aW1hZ2UvanBn:ARbn9L7e8RgQ8uItI-qXuIXnzPcawwaE34xvu1dWV1UQE64WDvKyer0vTvfB-sjEyZ5w4qtsKYx68ZpavbDfKNPa9BqkujVkWHRrXzWyUPaDzA:e:1707826617:834177964858133:61552296369370:ARYQLu5trcEKsqiVLJg",
              file_handle.h,
            ],
          },
        },
        {
          "type": "BODY",
          "text": text,
          "example": {
            "body_text": [
              [
                "Faizah", "Sarah", "Beesline", "whitening lift cream", "10", "199", "AED", "49",
              ],
            ],
          },
        },
      ],
    };

    try {
      const response = await axios.post(url, data, {headers: headers});
      response.data.name = name;
      response.data.text = text;
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

async function edit_message_template(shop, message_template_id, content) {
  const keys = await firebase_service.get_whatsapp_keys(shop);
  const url = `https://graph.facebook.com/v19.0/${message_template_id}`;
  const headers = {
    'Authorization': `Bearer ${keys.whatsapp_access_token}`,
  };

  const data = {
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
        "text": content,
        "example": {
          "body_text": [
            [
              "Faizah", "Sarah", "Beesline", "whitening lift cream", "10", "199", "AED", "49",
            ],
          ],
        },
      },
    ],
  };
  let response;
  try {
    response = await axios.post(url, data, {headers: headers});
  } catch (error) {
    if (error.response) {
      console.error('Whatsapp error response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }

  return response.data;
}

module.exports = {get_brand_message_templates, create_message_templates, edit_message_template};
