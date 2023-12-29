const stripe = require('stripe')('sk_test_51ORH1oCUveDWoBMaDE7JPwXOWNa9CIPQTiaWx3AXG05O9q4I2Ev6jwOP59f4zE1cpH84jC4NEq4aBiMGRHzWJnzM00mJCTwQx5');
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

async function get_price_object(product_id) {
  // ToDo: get the price id of the product id
  const prices = await stripe.prices.list({product: product_id});
  return prices.data[0];
}

async function get_customer_data(phoneNumber) {
  const user_doc = await db.collection('Users').doc(phoneNumber).get();
  const user_data = user_doc.data();
  if (user_doc.exists && user_data.customer_id && user_data.payment_method) {
    return user_data;
  } else return null;
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

const generateCheckoutSession = async (phoneNumber, product_id) => {
  try {
    // const paymentLink = await generatePaymentLink(phoneNumber, product_id);
    // const payment_url = paymentLink.url;
    // const price = await get_price_object(product_id);
    // const price_id = price.id;
    // const price_amount = price.unit_amount;
    // const customer_id = get_customer_id(phoneNumber);
    // const paymentIntent = null;
    // ToDo: generate a payment intent using the amount of the product
    const session = await stripe.checkout.sessions.create({
      // line_items: [
      //   {
      //     price: price_id,
      //     quantity: 1,
      //   },
      // ],
      // Custom fields is not supported when mode is setup
      // custom_fields: [
      //   {
      //     key: 'Name',
      //     label: {
      //       custom: 'Enter your Name',
      //       type: 'custom',
      //     },
      //     type: 'text',
      //   },
      // ],
      custom_text: {
        submit: {
          message: "We'll use your card to facilitate frictionless payments authorized by you.",
        },
      },
      payment_method_types: ['card'],
      mode: 'setup',
      // customer_creation: 'always',
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
};

async function update_status(phoneNumber, payment_intent) {
  const user_ref = db.collection('Users').doc(phoneNumber);

  await user_ref.set({
    current_payment_intent: payment_intent.id,
    payment_intent_status: payment_intent.status,
  }, {merge: true});
}


const generatePaymentIntent = async (phoneNumber, product_id) => {
  try {
    const price = await get_price_object(product_id);
    const price_amount = price.unit_amount;
    const user = await get_customer_data(phoneNumber);
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
    await update_status(phoneNumber, paymentIntent);
    return paymentIntent;
  } catch (error) {
    console.error("Error generating intent:", error.response ? error.response.data : error.message);
  }
};

const confirmPaymentIntent = async (phoneNumber) => {
  try {
    const user = await get_customer_data(phoneNumber);
    const payment_intent = user.current_payment_intent;
    const payment_id = user.payment_method;
    // ToDo: generate a payment intent using the amount of the product
    const paymentIntent = await stripe.paymentIntents.confirm(
        payment_intent,
        {
          payment_method: payment_id,
        },
    );
    await update_status(phoneNumber, paymentIntent);
    return paymentIntent;
  } catch (error) {
    console.error("Error generating intent:", error.response ? error.response.data : error.message);
  }
};

// const immediatePaymentIntent = async (phoneNumber, product_id) => {
//   try {
//     const price = await get_price_object(product_id);
//     const price_amount = price.unit_amount;
//     const user = await get_customer_data(phoneNumber);
//     const customer_id = user.customer_id;
//     const payment_id = user.payment_method;
//     const email = user.customer_email;
//     // ToDo: generate a payment intent using the amount of the product that has confirmation true
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: price_amount,
//       currency: 'usd',
//       automatic_payment_methods: {
//         enabled: true,
//         allow_redirects: 'never',
//       },
//       // add the customer id of the user
//       customer: customer_id,
//       setup_future_usage: 'off_session',
//       payment_method: payment_id,
//       receipt_email: email,
//     });
//     return paymentIntent;
//   } catch (error) {
//     console.error("Error generating intent:", error.response ? error.response.data : error.message);
//   }
// };

module.exports = {generatePaymentLink, generatePaymentIntent, generateCheckoutSession, confirmPaymentIntent};
