const firebase_service = require('../services/firebase_service');
// const stripe = require('stripe')('sk_test_51ORH1oCUveDWoBMaDE7JPwXOWNa9CIPQTiaWx3AXG05O9q4I2Ev6jwOP59f4zE1cpH84jC4NEq4aBiMGRHzWJnzM00mJCTwQx5');

function getStripeInstance(secretKey) {
  const stripe = require('stripe')(secretKey);
  return stripe;
}

async function get_product_id(productName, shop) {
  const secretKey = await firebase_service.get_stripe_key(shop);
  const stripe = getStripeInstance(secretKey);
  const products = await stripe.products.search({
    query: `name:'${productName}'`,
  });

  // Check if a product was found
  if (products.data.length === 0) {
    throw new Error(`Product with name ${productName} not found`);
  }

  // Get the product id out of the product object
  const productId = products.data[0].id;
  return productId;
}

async function get_product_ids(product_list, shop) {
  try {
    const secretKey = await firebase_service.get_stripe_key(shop);
    const stripe = getStripeInstance(secretKey);
    const productsWithIds = [];

    for (const product of product_list) {
      const nameQuery = `name:'${product.product_name.replace(/'/g, "\\'")}'`;
      const idQuery = `metadata['shopify_product_id']:'${product.product_id}'`;
      const searchQuery = `${nameQuery} AND ${idQuery}`;

      // Use the Stripe API's search endpoint with the constructed query for each product
      const products = await stripe.products.search({
        query: searchQuery,
      });

      // If a product is found, add its ID to the product object and add it to the array
      if (products.data.length > 0) {
        product.stripe_product_id = products.data[0].id;
        productsWithIds.push(product);
      } else {
        // Handle the case where a product is not found
        console.error(`Product not found: ${product.product_name}`);
        // Depending on your use case, you might want to throw an error or just continue
      }
    }

    return productsWithIds;
  } catch (error) {
    console.error("Error in get_product_ids:", error);
    throw error; // Rethrow the error to handle it in the calling function
  }
}


async function create_customer(email, phone_number, payment_method, address, shop) {
  const secretKey = await firebase_service.get_stripe_key(shop);
  const stripe = getStripeInstance(secretKey);
  const customer = await stripe.customers.create({
    address: {
      city: address.city,
      country: address.country,
      line1: address.line1,
      line2: address.line2,
      postal_code: address.postal_code,
      state: address.state,
    },
    email: email,
    phone: phone_number,
  });
  await stripe.paymentMethods.attach(
      payment_method,
      {
        customer: customer.id,
      },
  );
  return customer;
}

async function update_customer(customer_id, address, payment_method, phone_number, shop) {
  const secretKey = await firebase_service.get_stripe_key(shop);
  const stripe = getStripeInstance(secretKey);
  const customer = await stripe.customers.update(
      customer_id,
      {
        address: {
          city: address.city,
          country: address.country,
          line1: address.line1,
          line2: address.line2,
          postal_code: address.postal_code,
          state: address.state,
        },
        phone: phone_number,
      },
  );
  await stripe.paymentMethods.attach(
      payment_method,
      {
        customer: customer.id,
      },
  );
  return customer;
}

// async function get_price_object(product_id) {
//   // ToDo: get the price id of the product id
//   const prices = await stripe.prices.list({product: product_id});
//   return prices.data[0];
// }

async function get_price_objects(product_ids, shop) {
  const secretKey = await firebase_service.get_stripe_key(shop);
  const stripe = getStripeInstance(secretKey);
  const priceObjects = [];

  for (const product_id of product_ids) {
    try {
      const prices = await stripe.prices.list({product: product_id});
      priceObjects.push(prices.data[0]);
    } catch (error) {
      console.error(`Error getting price for product ${product_id}:`, error);
      // Depending on your use case, you might want to throw the error, return a partial result, or just continue
    }
  }

  return priceObjects;
}

async function get_card_details(payment_method_id, shop) {
  const secretKey = await firebase_service.get_stripe_key(shop);
  const stripe = getStripeInstance(secretKey);
  const paymentMethod = await stripe.paymentMethods.retrieve(
      payment_method_id,
  );
  return paymentMethod;
}

async function get_customer_address(customer_id, shop) {
  const secretKey = await firebase_service.get_stripe_key(shop);
  const stripe = getStripeInstance(secretKey);
  const customer = await stripe.customers.retrieve(
      customer_id,
  );
  return customer;
}

async function generatePaymentLink(phoneNumber, product_ids, shop) {
  try {
    const secretKey = await firebase_service.get_stripe_key(shop);
    const stripe = getStripeInstance(secretKey);
    const prices = await get_price_objects(product_ids, shop);
    const data = [];
    for (const price of prices) {
      data.push({
        price: price.id,
        quantity: 1,
      });
    }
    const paymentLink = await stripe.paymentLinks.create({
      line_items: data,
      metadata: {
        phone: phoneNumber,
      },
      customer_creation: 'always',
    });
    return paymentLink;
  } catch (error) {
    console.error("Error generating link:", error.response ? error.response.data : error.message);
  }
}

async function generateCheckoutSession(phoneNumber, shop) {
  try {
    const secretKey = await firebase_service.get_stripe_key(shop);
    const stripe = getStripeInstance(secretKey);
    const customer_id = await firebase_service.get_customer_id(phoneNumber);
    let session;
    if (customer_id) {
      session = await stripe.checkout.sessions.create({
        customer: customer_id,
        custom_text: {
          submit: {
            message: "We'll use your card to facilitate frictionless payments authorized by you.",
          },
        },
        payment_method_types: ['card'],
        mode: 'setup',
        metadata: {
          phone: phoneNumber,
          shop: shop,
        },
        // Later on replace those urls with the actual urls of the brands.
        success_url: 'https://yourwebsite.com/success?session_id={CHECKOUT_SESSION_ID}',
        shipping_address_collection: {
          allowed_countries: ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'GB', 'IS', 'NO', 'CH', 'LI', 'AE', 'BH', 'KW', 'OM', 'QA', 'SA', 'US', 'CA'],
        },
        consent_collection: {
          payment_method_reuse_agreement: {
            position: 'auto',
          },
        },
      });
    } else {
      session = await stripe.checkout.sessions.create({
        custom_text: {
          submit: {
            message: "We'll use your card to facilitate frictionless payments authorized by you.",
          },
        },
        payment_method_types: ['card'],
        mode: 'setup',
        metadata: {
          phone: phoneNumber,
          shop: shop,
        },
        // Later on replace those urls with the actual urls of the brands.
        success_url: 'https://yourwebsite.com/success?session_id={CHECKOUT_SESSION_ID}',
        shipping_address_collection: {
          allowed_countries: ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'GB', 'IS', 'NO', 'CH', 'LI', 'AE', 'BH', 'KW', 'OM', 'QA', 'SA', 'US', 'CA'],
        },
        consent_collection: {
          payment_method_reuse_agreement: {
            position: 'auto',
          },
        },
      });
    }

    return session;
  } catch (error) {
    console.error("Error generating checkout session:", error.response ? error.response.data : error.message);
  }
}

async function generatePaymentIntent(phoneNumber, stripe_product_ids, shop) {
  try {
    const secretKey = await firebase_service.get_stripe_key(shop);
    const stripe = getStripeInstance(secretKey);
    const currency = await firebase_service.get_store_currency(shop);
    const prices = await get_price_objects(stripe_product_ids, shop);
    let price_amount = 0;
    for (const price of prices) {
      price_amount += price.unit_amount;
    }
    const user = await firebase_service.get_customer_data(phoneNumber);
    const customer_id = user.customer_id;
    const payment_id = user.payment_method;
    const email = user.customer_email;
    // ToDo: generate a payment intent using the amount of the product
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price_amount,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      // add the customer id of the user
      customer: customer_id,
      setup_future_usage: 'off_session',
      payment_method: payment_id,
      receipt_email: email,
      metadata: {
        shop: shop,
      },
    });
    await firebase_service.update_status(phoneNumber, paymentIntent);
    return paymentIntent;
  } catch (error) {
    console.error("Error generating intent:", error.response ? error.response.data : error.message);
  }
}

async function confirmPaymentIntent(phoneNumber, shop) {
  try {
    const secretKey = await firebase_service.get_stripe_key(shop);
    const stripe = getStripeInstance(secretKey);
    const user = await firebase_service.get_customer_data(phoneNumber);
    const payment_intent = user.current_payment_intent;
    const payment_id = user.payment_method;
    const paymentIntent = await stripe.paymentIntents.confirm(
        payment_intent,
        {
          payment_method: payment_id,
        },
    );
    await firebase_service.update_status(phoneNumber, paymentIntent);
    // const shop = await firebase_service.get_users_conversation(phoneNumber);
    await firebase_service.increment_sales(shop, paymentIntent.amount/100, paymentIntent.id);
    return paymentIntent;
  } catch (error) {
    console.error("Error confirming intent:", error.response ? error.response.data : error.message);
  }
}

async function deletePaymentIntent(payment_intent_id, shop) {
  const secretKey = await firebase_service.get_stripe_key(shop);
  const stripe = getStripeInstance(secretKey);
  await stripe.paymentIntents.cancel(
      payment_intent_id,
  );
}

async function get_payment_method(setup_intent, shop) {
  const secretKey = await firebase_service.get_stripe_key(shop);
  const stripe = getStripeInstance(secretKey);
  const setupIntent = await stripe.setupIntents.retrieve(setup_intent);
  const payment_method = setupIntent.payment_method;
  return payment_method;
}

async function get_customer_id(email, shop) {
  const secretKey = await firebase_service.get_stripe_key(shop);
  const stripe = getStripeInstance(secretKey);
  const customers = await stripe.customers.list({
    limit: 1,
    email: email,
  });
  if (customers.data.length === 0) {
    throw new Error(`Customer with email ${email} not found`);
  }

  // Get the product id out of the product object
  const customer_id = customers.data[0].id;
  return customer_id;
}

async function get_last_payment_intent(customer_id, shop) {
  const secretKey = await firebase_service.get_stripe_key(shop);
  const stripe = getStripeInstance(secretKey);
  const paymentIntents = await stripe.paymentIntents.list({
    limit: 1,
    customer: customer_id,
  });
  if (paymentIntents.data.length === 0) {
    throw new Error(`Payment intent for customer ${customer_id} not found`);
  }

  return paymentIntents.data[0];
}

async function create_refund(phoneNumber, payment_intent, shop) {
  const secretKey = await firebase_service.get_stripe_key(shop);
  const stripe = getStripeInstance(secretKey);
  const refund = await stripe.refunds.create({
    payment_intent: payment_intent,
  });
  await firebase_service.refund_sale(shop, refund.payment_intent);
  return refund;
}

async function createProductAndPrice(productName, shopify_product_id, price, currency, shop) {
  try {
    const secretKey = await firebase_service.get_stripe_key(shop);
    const stripe = getStripeInstance(secretKey);
    let product;
    try {
      const productId = await get_product_id(productName, shop);
      product = await stripe.products.retrieve(productId);
    } catch (error) {
      // If product does not exist, create a new one
      if (error.message === `Product with name ${productName} not found`) {
        product = await stripe.products.create({
          name: productName,
          metadata: {
            shopify_product_id: shopify_product_id,
          },
        });
        console.log(`Product created: ${productName}`);
      } else {
        throw error; // If the error is not about the product not being found, rethrow it
      }
    }

    // Check if a price already exists for the product
    const prices = await stripe.prices.list({product: product.id});
    if (prices.data.length === 0) {
      // If no price exists, create a new one
      // Note: Convert price to the smallest unit (most currencies that are relevant to us are this)
      // USD, EUR, AED, EGP, GBP, AUD, CHF, ZAR, INR, SGD, HKD, NZD, SEK, DKK, NOK, MXN, BRL, MYR, PHP, THB
      const priceInSmallestUnit = parseInt(parseFloat(price) * 100);
      await stripe.prices.create({
        unit_amount: priceInSmallestUnit,
        currency: currency.toLowerCase(),
        product: product.id,
      });
      console.log(`Price created for product: ${productName} with price: ${price}`);
    } else {
      console.log(`Product and price already exist, skipping: ${productName}`);
    }
  } catch (error) {
    console.error(`Error creating product: ${productName}`, error);
  }
}

module.exports = {getStripeInstance, update_customer, deletePaymentIntent, generatePaymentLink, get_customer_address, generatePaymentIntent, generateCheckoutSession, confirmPaymentIntent, get_card_details, create_customer, get_payment_method, get_product_id, get_customer_id, get_last_payment_intent, create_refund, createProductAndPrice, get_product_ids};
