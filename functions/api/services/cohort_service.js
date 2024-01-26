// const axios = require('axios');

async function get_customers_and_line_items(checkouts_array) {
  const structured_customers = [];

  for (const checkout of checkouts_array) {
    let customer_phone_number;
    if (!checkout.customer.phone && !(checkout.customer.default_address && checkout.customer.default_address.phone)) {
      customer_phone_number = null;
    } else {
      customer_phone_number = checkout.customer.phone || checkout.customer.default_address.phone;
    }


    const customer_name =checkout.customer.first_name || null;

    const cohort = checkout.cohort;

    const product_list = checkout.line_items.map((item) => ({
      product_id: item.product_id,
      product_name: item.title,
      variant_title: item.variant_title,
    }));

    const checkout_started_at = checkout.created_at;

    const data = {
      customer_name: customer_name,
      customer_phone: customer_phone_number,
      checkout_started_at: checkout_started_at,
      cohort: cohort,
      product_list: product_list,
    };
    structured_customers.push(data);
  }

  return structured_customers;
}


async function structure_data_for_messaging(checkouts_with_cohorts) {
  const structured_data = await get_customers_and_line_items(checkouts_with_cohorts);

  return structured_data;
}

async function get_customers_with_cohorts(abandoned_checkouts, cohorts) {
  return abandoned_checkouts.map((abandoned_checkout) => {
    // Determine the cohort for this checkout based on your conditions
    const cohort = determineCohort(abandoned_checkout, cohorts);

    // Assign the cohort to the checkout
    abandoned_checkout.cohort = cohort;

    return abandoned_checkout;
  });
}

function determineCohort(checkout, cohorts) {
  // Determine if the customer is a first time or returning customer
  const customerType = checkout.customer.orders_count === 0 ? 'first_time' : 'returning';

  // Find the cohort that matches the customer type, cart value, and number of items in cart
  const cohort = cohorts.find((cohort) => {
    const purchaseFrequencyIncludesCustomer = cohort.purchase_frequency.includes(customerType);
    const cartValueIsWithinRange = (cohort.cart_value[0] === undefined || checkout.total_price >= cohort.cart_value[0]) &&
                                       (cohort.cart_value[1] === undefined || checkout.total_price <= cohort.cart_value[1]);
    const itemsInCartIsWithinRange = (cohort.items_in_cart[0] === undefined || checkout.line_items.length >= cohort.items_in_cart[0]) &&
                                         (cohort.items_in_cart[1] === undefined || checkout.line_items.length <= cohort.items_in_cart[1]);
    return purchaseFrequencyIncludesCustomer && cartValueIsWithinRange && itemsInCartIsWithinRange;
  });

  // If no cohort matches, you might want to handle this case differently
  return cohort || null;
}

async function send_messages(access_token, shop, structured_data) {
//   const url = `https://us-central1-textlet-test.cloudfunctions.net/webhook/texting/SendMessagesToMass`;
  const body = {
    selectedPeople: structured_data,
    shop: shop,

  };
  //   const response = await axios.post(url, body, {
  //     headers: {
  //       'X-Shopify-Access-Token': access_token,
  //     },
  //   });
  // do this request from the terminal with 1 customer and test with it!
  return body;
}

module.exports = {get_customers_with_cohorts, structure_data_for_messaging, send_messages};
