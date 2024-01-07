const axios = require('axios');

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

async function get_products_for_refill_feature(shop, access_token) {
  const url = `https://${shop}/admin/api/2023-10/products.json?fields=id,images,title`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching abandoned orders:', error);
    throw error;
  }
}

module.exports = {get_abandoned_orders, get_products_for_refill_feature};
