const axios = require('axios');
// const stripe_service = require('../services/stripe_service');

async function get_customers_and_line_items(checkouts_array, shop) {
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

    const product_list = await Promise.all(
        checkout.line_items.map(async (item) => {
          // const price = await stripe_service.get_price(item.product_id, shop);
          return {
            product_id: item.product_id,
            product_name: item.title,
            variant_title: item.variant_title,
            // additional_info: price.unit_amount,
          };
        }),
    );

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


async function structure_data_for_messaging(checkouts_with_cohorts, shop) {
  const structured_data = await get_customers_and_line_items(checkouts_with_cohorts, shop);

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
  const url = `https://us-central1-textlet-test.cloudfunctions.net/webhook/texting/SendMessagesToMass`;

  const date = new Date();
  date.setHours(date.getHours() - 8);
  const checkout_started_at = date.toISOString();

  const structured_data2 = [{
    customer_name: "Ahmed",
    customer_phone: "201200025500",
    checkout_started_at: checkout_started_at,
    cohort: {
      cohort_id: "Pre-defined 1",
      cohort_type: "Pre-defined",
      cohort_number: 1,
      discount_amount_in_1: 0,
      discount_amount_in_2: 20,
      discount_in_first: false,
      discount_in_second: true,
      discount_message1: "You'll have a {discountAmount}% discount if you complete your purchase now.",
      discount_message2: "You'll have a {discountAmount}% discount if you complete your purchase now.",
      first_reminder_active: true,
      first_reminder_time: 1,
      items_in_cart: [0, 10],
      message_close1: "Just reply \"Yes\" and I'll help you checkout now!🚀",
      message_close2: "Just reply \"Yes\" and I'll help you checkout now!🚀",
      message_opener1: "Hey {personName},👋 I am {humanName} from {brandName}. I noticed that you left your cart without checking out. I can help you checkout here easily and quickly! Your cart contained:",
      message_opener2: "Hey {personName},👋 I am {humanName} from {brandName}. I noticed that you left your cart without checking out. I can help you checkout here easily and quickly! Your cart contained:",
      product_list1: "{productName} {variantTitle}",
      product_list2: "{productName} {variantTitle}",
      purchase_frequency: ["first_time", "returning"],
      second_reminder_active: true,
      second_reminder_time: 6,
    },
    product_list: [{
      product_id: 8839376765226,
      product_name: "Blue & Pink accent embroided 21 Cap",
      // variant_title: "M",
    }, {
      product_id: 8839349535018,
      product_name: "Bubbles Grey washed hoodie ( Blue Accent )",
      // variant_title: "Medium",
    },
    ],
  }];
  const body = {
    selectedPeople: structured_data2,
    // selectedPeople: structured_data,
    shop: shop,

  };
  const response = await axios.post(url, body, {
    headers: {
      'X-Shopify-Access-Token': access_token,
    },
  });
  return response;
}

module.exports = {get_customers_with_cohorts, structure_data_for_messaging, send_messages};
