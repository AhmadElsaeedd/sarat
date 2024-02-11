const axios = require('axios');
// const stripe_service = require('../services/stripe_service');

async function get_customers_and_line_items(array_of_items, shop) {
  const structured_customers = [];

  for (const item of array_of_items) {
    let customer_phone_number;
    let customer_name;
    let customer_currency;
    let cohort = [];
    let product_list = [];
    let checkout_started_at;
    if (item.type === "checkout") {
      if (!item.customer || !item.customer.phone && !(item.customer.default_address && item.customer.default_address.phone)) {
        customer_phone_number = null;
      } else {
        customer_phone_number = item.customer.phone || item.customer.default_address.phone;
      }
      customer_name = item.customer.first_name || null;
      customer_currency = item.presentment_currency;
      cohort = item.cohort;


      product_list = await Promise.all(
          item.line_items.map(async (item) => {
            return {
              product_id: item.product_id,
              product_name: item.title,
              variant_title: item.variant_title,
              variant_id: item.variant_id,
              price_in_presentment_currency: item.price,
            };
          }),
      );

      checkout_started_at = item.created_at;
    } else if (item.type === "cart") {
      customer_phone_number = item.phone_number;
      customer_name = null;
      customer_currency = item.line_items[0].line_price_set.presentment_money.currency_code;
      cohort = item.cohort;

      product_list = await Promise.all(
          item.line_items.map(async (item) => {
            return {
              product_id: item.product_id,
              product_name: item.title,
              variant_title: item.variant_title || null,
              variant_id: item.variant_id,
              price_in_presentment_currency: item.line_price_set.presentment_money.amount,
            };
          }),
      );

      checkout_started_at = item.created_at;
    }

    // const customer_currency = checkout.presentment_currency;

    // const cohort = checkout.cohort;

    // const product_list = await Promise.all(
    //     checkout.line_items.map(async (item) => {
    //       return {
    //         product_id: item.product_id,
    //         product_name: item.title,
    //         variant_title: item.variant_title,
    //         variant_id: item.variant_id,
    //         price_in_presentment_currency: item.price,
    //       };
    //     }),
    // );

    // const checkout_started_at = checkout.created_at;

    const data = {
      customer_name: customer_name,
      // customer_id: customer_id,
      customer_phone: customer_phone_number,
      checkout_started_at: checkout_started_at,
      customer_currency: customer_currency,
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

async function get_customers_with_cohorts(abandoned_everything, cohorts) {
  const allAbandonedWithCohorts = await Promise.all(
      abandoned_everything.map(async (abandoned_item) =>{
      // Determine the cohort for this checkout based on your conditions
        const cohort = await determineCohort(abandoned_item, cohorts);

        // Assign the cohort to the checkout
        abandoned_item.cohort = cohort;

        return abandoned_item;
      }),
  );

  return allAbandonedWithCohorts;
}

async function convertToDefaultCurrency(amount, fromCurrency, toCurrency) {
  try {
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/3c80aab809182f87cee1f7f9/pair/${fromCurrency}/${toCurrency}/${amount}`);
    return response.data.conversion_result;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

async function determineCohort(item, cohorts) {
  const item_type = item.type === "checkout" ? 'abandoned_checkouts' : "abandoned_carts";

  let customerType;
  let diffInDays = 0;
  let totalPriceInDefaultCurrency;
  let no_of_items_in_cart = 0;
  if (item.type === "checkout") {
    // Determine if the customer is a first time or returning customer
    customerType = item.customer.orders_count === 0 ? 'first_time' : 'returning';

    if (item.customer.last_order_date) {
      const lastOrderDate = new Date(item.customer.last_order_date);
      const now = new Date();
      const diffInTime = now.getTime() - lastOrderDate.getTime();
      diffInDays = diffInTime / (1000 * 3600 * 24);
    }

    // Assing the cart value here
    if (item.presentment_currency != item.currency) {
      totalPriceInDefaultCurrency = await convertToDefaultCurrency(item.total_price, item.presentment_currency, item.currency);
    } else {
      totalPriceInDefaultCurrency = item.total_price;
    }


    // Assign the number of items in the cart here
    no_of_items_in_cart = item.line_items.length;
  } else if (item.type === "cart") {
    // This object cannot be filtered based on last order so we're just gonna hide it in the dashboard when abandoned carts are included

    // assign the cart value here
    totalPriceInDefaultCurrency = item.line_items.reduce((total, lineItem) => {
      return total + Number(lineItem.line_price_set.shop_money.amount);
    }, 0);

    // Assign the number of items in the cart here
    no_of_items_in_cart = item.line_items.length;
  }


  // Find the cohort that matches the customer type, cart value, and number of items in cart
  const cohort = cohorts.find((cohort) => {
    const eventTypeIncludesItemType = cohort.event_type.includes(item_type);
    // This will always return false because we won't know whether they're a new customer or an old customer from an abandoned cart
    let purchaseFrequencyIncludesCustomer;
    if (item.type === "cart") {
      purchaseFrequencyIncludesCustomer = true;
    } else {
      purchaseFrequencyIncludesCustomer = cohort.purchase_frequency.includes(customerType);
    }
    const cartValueIsWithinRange = (cohort.cart_value[0] === undefined || cohort.cart_value[0] === 0 || totalPriceInDefaultCurrency >= cohort.cart_value[0]) &&
                                       (cohort.cart_value[1] === undefined || cohort.cart_value[1] === 0 || totalPriceInDefaultCurrency <= cohort.cart_value[1]);
    const itemsInCartIsWithinRange = (cohort.items_in_cart[0] === undefined || cohort.items_in_cart[0] === 0 || no_of_items_in_cart >= cohort.items_in_cart[0]) &&
                                         (cohort.items_in_cart[1] === undefined || cohort.items_in_cart[1] === 0 || no_of_items_in_cart <= cohort.items_in_cart[1]);
    const lastOrderIntervalMatches = diffInDays === 0 || cohort.last_order_interval === undefined || cohort.last_order_interval <= diffInDays;
    return eventTypeIncludesItemType && purchaseFrequencyIncludesCustomer && cartValueIsWithinRange && itemsInCartIsWithinRange && lastOrderIntervalMatches;
  });

  // If no cohort matches, you might want to handle this case differently
  return cohort || null;
}

async function combine_orders_with_abandoned_checkouts(abandoned_checkouts, orders) {
  for (const checkout of abandoned_checkouts) {
    // Find the order that matches the customer's last_order_id
    const matchingOrder = orders.find((order) => order.id === checkout.customer.last_order_id);

    // If a matching order is found, add its created_at field to the customer object
    if (matchingOrder) {
      checkout.customer.last_order_date = matchingOrder.created_at;
    }
  }

  // Now each checkout's customer object has a new field last_order_date
  // which is the created_at field of the order that matches the customer's last_order_id
  return abandoned_checkouts;
}

async function combine_both_arrays(abandoned_checkouts, abandoned_carts) {
  const checkoutsWithTypes = abandoned_checkouts.map((checkout) => ({
    ...checkout,
    type: 'checkout',
  }));

  const cartsWithTypes = abandoned_carts.map((cart) => ({
    ...cart,
    type: 'cart',
  }));

  return checkoutsWithTypes.concat(cartsWithTypes);
}

async function send_messages(shop, structured_data) {
  const url = `https://us-central1-textlet-test.cloudfunctions.net/webhook/texting/SendMessagesToMass`;

  const date = new Date();
  date.setHours(date.getHours() - 8);
  const checkout_started_at = date.toISOString();

  const structured_data2 = [{
    "customer_currency": "AED",
    "customer_name": "Ahmed",
    "customer_phone": "201200025500",
    "checkout_started_at": checkout_started_at,
    "cohort": {
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
      message_close1: "📲Just reply \"Yes\" and I'll help you checkout now!",
      message_close2: "📲Just reply \"Yes\" and I'll help you checkout now!",
      message_opener1: "Hey {personName},👋 I am {humanName} from {brandName}. I noticed that you left without checking out. I can help you checkout here! Your cart had:",
      message_opener2: "Hey {personName},👋 I am {humanName} from {brandName}. I noticed that you left without checking out. I can help you checkout here! Your cart had:",
      message_price1: "Total price is {price} {currency}",
      message_price2: "Total price is {price} {currency}",
      product_list1: "{productName} {variantTitle}",
      product_list2: "{productName} {variantTitle}",
      purchase_frequency: ["first_time", "returning"],
      second_reminder_active: true,
      second_reminder_time: 6,
    },
    "product_list": [
      {
        "product_id": 8839349535018,
        "product_name": "Bubbles Grey washed hoodie ( Blue Accent )",
        "variant_id": 47309185745194,
        "variant_name": "M",
        "price_in_presentment_currency": "800.00",
      },
    ],
  }];
  const body = {
    selectedPeople: structured_data2,
    // selectedPeople: structured_data,
    shop: shop,

  };
  const response = await axios.post(url, body);
  return response;
  // return body;
}

module.exports = {get_customers_with_cohorts, combine_both_arrays, structure_data_for_messaging, send_messages, combine_orders_with_abandoned_checkouts};
