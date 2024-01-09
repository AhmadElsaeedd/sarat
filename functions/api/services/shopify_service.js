const axios = require('axios');
// const {access} = require('fs');

async function get_customers_and_line_items(checkouts_array) {
  // Extracting customer and their line items
  const customerOrders = checkouts_array.reduce((orders, checkout) => {
    // skip any user who doesn't have checkout.phone || checkout.sms_marketing_phone || checkout.customer.phone || checkout.shipping_address.phone
    if (!checkout.phone && !checkout.sms_marketing_phone && !(checkout.customer && checkout.customer.phone) && !(checkout.shipping_address && checkout.shipping_address.phone)) {
      return orders;
    }

    if (checkout.customer && checkout.line_items) {
      // Throwing null if a said field doesn't exist
      const orderInfo = {
        customer_name: checkout.customer ? checkout.customer.first_name : null,
        // Assigning the first found phone to customer_phone
        customer_phone: checkout.phone || (checkout.customer && checkout.customer.phone) || checkout.sms_marketing_phone || (checkout.shipping_address && checkout.shipping_address.phone),
        product_id: checkout.line_items && checkout.line_items[0] ? checkout.line_items[0].product_id : null,
        product_title: checkout.line_items && checkout.line_items[0] ? checkout.line_items[0].title : null,
        product_variant_title: checkout.line_items && checkout.line_items[0] ? checkout.line_items[0].variant_title : null,
      };
      orders.push(orderInfo);
    }
    return orders;
  }, []);
  return customerOrders;
}

async function get_abandoned_orders(shop, access_token) {
  const url = `https://${shop}/admin/api/2023-10/checkouts.json`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    const customer_orders = await get_customers_and_line_items(response.data.checkouts);

    return customer_orders;
  } catch (error) {
    console.error('Error fetching abandoned orders:', error);
    throw error;
  }
}

async function products_refill_after_metafield(shop, access_token, product_id) {
  const url = `https://${shop}/admin/api/2023-10/products/${product_id}/metafields.json?key=refill_after`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    // If 'refill_after' field exists, return its value
    if (response.data.metafields && response.data.metafields.length > 0) {
      return response.data.metafields[0].value;
    }

    // If 'refill_after' field does not exist, return null
    return null;
  } catch (error) {
    console.error('Error fetching product metafields:', error);
    throw error;
  }
}

async function get_needed_data_about_products(shop, access_token, products) {
  // We need to find the refill after metafield attached to the product here too
  // const refill_after = await products_refill_after_metafield(shop, access_token, products);
  // If there is no refill after field attached to the product just assing null
  // products is an array
  // this function will return the product id, all the urls of the images of the products, the product name,
  // return products.map((product) => {
  //   return {
  //     product_id: product.id,
  //     product_image_url: product.images && product.images[0] ? product.images[0].src : null,
  //     product_name: product.title,
  //   };
  // });

  const structured_products = [];

  for (const product of products) {
    const refill_after = await products_refill_after_metafield(shop, access_token, product.id);
    structured_products.push({
      product_id: product.id,
      product_image_url: product.images && product.images[0] ? product.images[0].src : null,
      product_name: product.title,
      refill_after: refill_after,
    });
  }

  return structured_products;
}

async function get_products_for_refill_feature(shop, access_token) {
  const url = `https://${shop}/admin/api/2023-10/products.json?fields=id,images,title`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    const products = await get_needed_data_about_products(shop, access_token, response.data.products);

    return products;
  } catch (error) {
    console.error('Error fetching abandoned orders:', error);
    throw error;
  }
}

async function fallback_for_update_products_with_refill_field(shop, access_token, product) {
  const product_url = `https://${shop}/admin/api/2023-10/products/${product.product_id}/metafields.json?key=refill_after`;

  try {
    const response = await axios.get(product_url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    const metafield_url = `https://${shop}/admin/api/2023-10/products/${product.product_id}/metafields/${response.data.metafields[0].id}.json`;

    const data = {
      metafield: {
        id: response.data.metafields[0].id,
        value: product.refill_after,
        type: "number_integer",
      },
    };

    try {
      await axios.put(metafield_url, data, {
        headers: {
          'X-Shopify-Access-Token': access_token,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error updating metafield:', error);
    }
    //
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

async function update_products_with_refill_field(shop, access_token, products) {
  try {
    // Define a delay function
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Loop over each product
    for (const product of products) {
      const url = `https://${shop}/admin/api/2023-10/products/${product.product_id}.json`;

      // Prepare the data for the request
      const data = {
        product: {
          id: product.product_id,
          metafields: [
            {
              key: "refill_after",
              value: product.refill_after,
              type: "number_integer",
              namespace: "global",
            },
          ],
        },
      };

      try {
        // Try to add the "refill_after" field
        await axios.put(url, data, {
          headers: {
            'X-Shopify-Access-Token': access_token,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        await fallback_for_update_products_with_refill_field(shop, access_token, product);
      }

      // Wait for 500 milliseconds before the next request
      await delay(500);
    }
  } catch (error) {
    console.error('Error updating products:', error);
    throw error;
  }
}

async function create_products_refill_field(shop, access_token, product_id, refill_after) {
  const url = `https://${shop}/admin/api/2023-10/products/${product_id}/metafields.json`;

  try {
    const data = {
      metafield: {
        namespace: "global",
        key: "refill_after",
        value: refill_after,
        type: "number_integer",
      },
    };

    const response = await axios.post(url, data, {
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error creating product refill field:', error);
    throw error;
  }
}

async function get_product(shop, access_token, product_id) {
  const url = `https://${shop}/admin/api/2023-10/products/${product_id}.json`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

module.exports = {get_abandoned_orders, get_products_for_refill_feature, update_products_with_refill_field, get_product, create_products_refill_field};
