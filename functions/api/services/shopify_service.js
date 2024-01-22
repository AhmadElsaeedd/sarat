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

async function get_uncompleted_checkouts(checkouts) {
  const uncompleted_checkouts = [];

  for (const checkout of checkouts) {
    if (checkout.completed_at === null) {
      uncompleted_checkouts.push(checkout);
    }
  }
  return uncompleted_checkouts;
}

async function get_abandoned_orders(shop, access_token) {
  const url = `https://${shop}/admin/api/2023-10/checkouts.json?limit=250`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    // Remove all the checkouts that have been completed
    const uncompleted_checkouts = await get_uncompleted_checkouts(response.data.checkouts);

    const customer_orders = await get_customers_and_line_items(uncompleted_checkouts);

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

async function get_product_names_and_prices(shop, access_token) {
  const url = `https://${shop}/admin/api/2023-10/products.json?fields=id,title,variants`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    return response.data.products;
  } catch (error) {
    console.error('Error fetching abandoned orders:', error);
    throw error;
  }
}

async function get_needed_data_about_products(shop, access_token, products) {
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

async function get_products(shop, access_token) {
  const url = `https://${shop}/admin/api/2023-10/products.json?fields=id,images,title`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    return response.data.products;
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

    return response.data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

// Helper function to perform a HEAD request to get the MIME type of an image
async function getMimeType(url) {
  try {
    const response = await axios.head(url);
    return response.headers['content-type'];
  } catch (error) {
    console.error('Error fetching MIME type for URL:', url, error);
    return null; // Return null if there's an error fetching the MIME type
  }
}

// Helper function to filter images by supported MIME types
async function filterSupportedImages(images) {
  const supportedMimeTypes = ['image/jpeg', 'image/png'];
  const checks = images.map(async (image) => {
    const mimeType = await getMimeType(image.src);
    return supportedMimeTypes.includes(mimeType) ? image : null;
  });
  const results = await Promise.all(checks);
  return results.filter((image) => image !== null); // Filter out null values
}

async function get_product_image(shop, access_token, product_id) {
  const url = `https://${shop}/admin/api/2023-10/products/${product_id}.json`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    const images = response.data.product.images;
    const supportedImages = await filterSupportedImages(images);

    return supportedImages.map((image) => image.src);
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

async function get_customer_ids(customers) {
  return customers.map((customer) => customer.id);
}

async function get_customer_ids_for_refill_feature(shop, access_token) {
  const url = `https://${shop}/admin/api/2023-10/customers/search.json?query=orders_count%3A%3E%3D1&fields=id`;


  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    // get only the id's of the customers from response.data.customers in the function get_customer_ids
    const customer_ids = await get_customer_ids(response.data.customers);

    return customer_ids;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

async function get_order_data(orders) {
  return orders.map((order) => ({
    line_items: order.line_items,
    id: order.id,
    processed_at: order.processed_at,
  }));
}

async function get_customer_orders(shop, access_token, customer_id) {
  const url = `https://${shop}/admin/api/2023-10/customers/${customer_id}/orders.json?status=closed`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    const orders = await get_order_data(response.data.orders);

    return orders;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

async function get_customer_phone_number(shop, access_token, customer_id) {
  const url = `https://${shop}/admin/api/2023-10/customers/${customer_id}.json`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    console.log("This is the customer returned from the get_customer_phone_number function: ", response.data.customer);

    if (!response.data.customer.phone && !response.data.customer.addresses[0].phone && !(response.data.customer.default_address && response.data.customer.default_address.phone)) {
      return null;
    }

    const customer_phone_number = response.data.customer.phone || response.data.customer.addresses[0].phone || response.data.customer.default_address.phone;

    const data = {
      phone_number: customer_phone_number,
      name: response.data.customer.first_name,
    };

    return data;
  } catch (error) {
    console.error('Error fetching customer phone number:', error);
    throw error;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Loop throuch each customer id in the array customer ids
// Use get_customer_orders() to get the orders of the customers
// Loop through each product in the line_items array
// From the product object inside the line_items array you can get its id and each product in the array "products" has an `id` field
// Compare the refill_after field of the product with the processed_at field of the order that the product belongs to
// If the processed_at field is greater or equal than the refill_after after, then add an object to an array that will be returned from this function
// Each object returned by this function should contain the customer id, the product id, the product name
async function get_customers_who_need_refill(shop, access_token, products, customer_ids) {
  const customersWhoNeedRefill = [];

  for (const customerId of customer_ids) {
    const orders = await get_customer_orders(shop, access_token, customerId);

    for (const order of orders) {
      for (const lineItem of order.line_items) {
        const product = products.find((p) => p.product_id === lineItem.product_id);

        // If the product's refill_after field is null, skip this product
        if (!product || !product.refill_after) {
          continue;
        }

        if (new Date(order.processed_at) >= new Date(product.refill_after)) {
          // get the customer's phone number
          const user_data = await get_customer_phone_number(shop, access_token, customerId);
          customersWhoNeedRefill.push({
            customer_id: customerId,
            customer_phone: user_data.phone_number,
            customer_name: user_data.name,
            product_id: product.product_id,
            product_title: product.product_name,
          });
        }
      }
    }

    await delay(450); // delay for 450 milliseconds
  }

  return customersWhoNeedRefill;
}

// async function get_customers_with_phone_numbers(shop, access_token, customer_ids) {
//   const customers = [];

//   for (const customer_id of customer_ids) {
//     // get the customer's phone number and name
//     const user_data = await get_customer_phone_number(shop, access_token, customer_id);

//     // If the phone number is null, skip this user
//     if (!user_data || !user_data.phone_number) {
//       continue;
//     }

//     customers.push({
//       customer_id: customer_id,
//       customer_phone: user_data.phone_number,
//       customer_name: user_data.name,
//     });
//     await delay(450); // delay for 450 milliseconds
//   }

//   return customers;
// }

async function get_customers_with_phone_numbers(customers) {
  const customers_with_phone_numbers = [];

  for (const customer of customers) {
    // If the phone number is null, skip this user
    // if (!user_data || !user_data.phone_number) {
    //   continue;
    // }

    if (!customer.phone && !customer.addresses[0].phone && !(customer.default_address && customer.default_address.phone)) {
      return null;
    }

    const customer_phone_number = customer.phone || customer.addresses[0].phone || customer.default_address.phone;

    // const data = {
    //   phone_number: customer_phone_number,
    //   name: response.data.customer.first_name,
    // };

    customers_with_phone_numbers.push({
      customer_id: customer.id,
      customer_phone: customer_phone_number,
      customer_name: customer.first_name,
    });
    // await delay(450); // delay for 450 milliseconds
  }
  return customers_with_phone_numbers;
}

async function get_customers_for_product_launches(shop, access_token) {
  // const url = `https://${shop}/admin/api/2023-10/customers.json?fields=id,&limit=250`;
  const url = `https://${shop}/admin/api/2023-10/customers.json?limit=250`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    console.log("Number of customers returned: ", response.data.customers.length);

    console.log("This is the first customer returned from the get_customers_for_product_launches function: ", response.data.customers[0]);

    const customer_ids = await get_customer_ids(response.data.customers);

    console.log("Number of customers returned: ", customer_ids.length);

    // const customers = await get_customers_with_phone_numbers(shop, access_token, customer_ids);
    const customers = await get_customers_with_phone_numbers(response.data.customers);

    return customers;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

module.exports = {get_abandoned_orders, get_products_for_refill_feature, update_products_with_refill_field, get_product, create_products_refill_field, get_customer_ids_for_refill_feature, get_customers_who_need_refill, get_customer_orders, get_product_image, get_product_names_and_prices, get_products, get_customers_for_product_launches};
