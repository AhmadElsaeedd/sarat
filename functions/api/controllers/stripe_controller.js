const stripe = require('stripe')('sk_test_51ORH1oCUveDWoBMaDE7JPwXOWNa9CIPQTiaWx3AXG05O9q4I2Ev6jwOP59f4zE1cpH84jC4NEq4aBiMGRHzWJnzM00mJCTwQx5');
const endpointSecret = 'whsec_6pijIngHHM6o1qNAPjiKOMra4CJlI7ry';
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

const postStripe = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      // Handle checkout session completion
      await handlePurchase(session);
      break;
    }
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({received: true});
};

// async function create_customer(name, email, phone_number, payment_method) {
//   console.log("HERE 1");
//   const customer = await stripe.customers.create({
//     // name: name,
//     email: email,
//     phone: phone_number,
//     // payment_method: payment_method,
//   });
//   console.log("HERE 2");
//   await stripe.paymentMethods.attach(
//       payment_method,
//       {
//         customer: customer.id,
//       },
//   );
//   console.log("HERE 3");
//   return customer;
// }

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

async function store_data(customer, phoneNumber, payment_method) {
  if (typeof phoneNumber === 'number') {
    phoneNumber = phoneNumber.toString();
  }
  const user_ref = db.collection('Users').doc(phoneNumber);

  // Purchase complete now I want to store the user's data
  await user_ref.set({
    payment_method: payment_method,
    customer_id: customer.id,
    customer_email: customer.email,
    // customer_name: customer.name,
    // reset the product
    current_product: "",
  }, {merge: true});
}

// async function get_user_phone(payment_link) {
//   const paymentLink = await stripe.paymentLinks.retrieve(
//       payment_link,
//   );
//   const phone_number = paymentLink.metadata.phone;
//   return phone_number;
// }

async function get_payment_method(setup_intent) {
  const setupIntent = await stripe.setupIntents.retrieve(setup_intent);
  const payment_method = setupIntent.payment_method;
  return payment_method;
}

async function handlePurchase(session) {
  console.log("Session object is: ", session);
  const setup_intent = session.setup_intent;
  const payment_method = await get_payment_method(setup_intent);
  const user_email = session.customer_details.email;
  // const user_name = session.customer_details.Name;
  // const user_phone = await get_user_phone(session.payment_link);
  const user_phone = session.metadata.phone;
  const customer = await create_customer(user_email, user_phone, payment_method);
  await store_data(customer, user_phone, payment_method);
}

module.exports = {postStripe};
