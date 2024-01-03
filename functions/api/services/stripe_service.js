const firebase_service = require('../services/firebase_service');
const stripe = require('stripe')('sk_test_51ORH1oCUveDWoBMaDE7JPwXOWNa9CIPQTiaWx3AXG05O9q4I2Ev6jwOP59f4zE1cpH84jC4NEq4aBiMGRHzWJnzM00mJCTwQx5');

async function get_product_id(productName) {
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


async function create_customer(email, phone_number, payment_method) {
  const customer = await stripe.customers.create({
    // name: name,
    email: email,
    phone: phone_number,
    // payment_method: payment_method,
  });
  await stripe.paymentMethods.attach(
      payment_method,
      {
        customer: customer.id,
      },
  );
  return customer;
}

async function get_price_object(product_id) {
  // ToDo: get the price id of the product id
  const prices = await stripe.prices.list({product: product_id});
  return prices.data[0];
}

async function get_card_details(payment_method_id) {
  const paymentMethod = await stripe.paymentMethods.retrieve(
      payment_method_id,
  );
  return paymentMethod;
}

async function generatePaymentLink(phoneNumber, product_id) {
  try {
    const price = await get_price_object(product_id);
    const price_id = price.id;
    // ToDo: generate a payment link using the price_id of the product
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
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

async function generateCheckoutSession(phoneNumber, product_id) {
  try {
    const session = await stripe.checkout.sessions.create({
      custom_text: {
        submit: {
          message: "We'll use your card to facilitate frictionless payments authorized by you.",
        },
      },
      payment_method_types: ['card'],
      mode: 'setup',
      metadata: {
        phone: phoneNumber,
      },
      // Later on replace those urls with the actual urls of the brands.
      success_url: 'https://yourwebsite.com/success?session_id={CHECKOUT_SESSION_ID}',
    });
    return session;
  } catch (error) {
    console.error("Error generating checkout session:", error.response ? error.response.data : error.message);
  }
}

async function generatePaymentIntent(phoneNumber, product_id) {
  try {
    const price = await get_price_object(product_id);
    const price_amount = price.unit_amount;
    const user = await firebase_service.get_customer_data(phoneNumber);
    const customer_id = user.customer_id;
    const payment_id = user.payment_method;
    const email = user.customer_email;
    // ToDo: generate a payment intent using the amount of the product
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price_amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      // add the customer id of the user
      customer: customer_id,
      setup_future_usage: 'off_session',
      payment_method: payment_id,
      receipt_email: email,
    });
    await firebase_service.update_status(phoneNumber, paymentIntent);
    return paymentIntent;
  } catch (error) {
    console.error("Error generating intent:", error.response ? error.response.data : error.message);
  }
}

async function confirmPaymentIntent(phoneNumber) {
  try {
    const user = await firebase_service.get_customer_data(phoneNumber);
    const payment_intent = user.current_payment_intent;
    const payment_id = user.payment_method;
    // ToDo: generate a payment intent using the amount of the product
    const paymentIntent = await stripe.paymentIntents.confirm(
        payment_intent,
        {
          payment_method: payment_id,
        },
    );
    await firebase_service.update_status(phoneNumber, paymentIntent);
    const shop = await firebase_service.get_users_conversation(phoneNumber);
    await firebase_service.increment_number_of_sales(shop);
    await firebase_service.increment_decrement_sales_volume(shop, paymentIntent.amount);
    return paymentIntent;
  } catch (error) {
    console.error("Error generating intent:", error.response ? error.response.data : error.message);
  }
}

async function get_payment_method(setup_intent) {
  const setupIntent = await stripe.setupIntents.retrieve(setup_intent);
  const payment_method = setupIntent.payment_method;
  return payment_method;
}

async function get_customer_id(email) {
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

async function get_last_payment_intent(customer_id) {
  const paymentIntents = await stripe.paymentIntents.list({
    limit: 1,
    customer: customer_id,
  });
  if (paymentIntents.data.length === 0) {
    throw new Error(`Payment intent for customer ${customer_id} not found`);
  }

  return paymentIntents.data[0];
}

async function create_refund(phoneNumber, payment_intent) {
  const refund = await stripe.refunds.create({
    payment_intent: payment_intent,
  });
  const shop = await firebase_service.get_users_conversation(phoneNumber);
  await firebase_service.decrement_number_of_sales(shop);
  await firebase_service.increment_decrement_sales_volume(shop, refund.amount);
  return refund;
}

module.exports = {generatePaymentLink, generatePaymentIntent, generateCheckoutSession, confirmPaymentIntent, get_card_details, create_customer, get_payment_method, get_product_id, get_customer_id, get_last_payment_intent, create_refund};
