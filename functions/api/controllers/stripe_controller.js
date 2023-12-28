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

async function create_customer(name, email, phone_number) {
  const customer = await stripe.customers.create({
    name: name,
    email: email,
    phone: phone_number,
  });
  return customer;
}

async function store_data(customer, phoneNumber) {
  if (typeof phoneNumber === 'number') {
    phoneNumber = phoneNumber.toString();
  }
  const user_ref = db.collection('Users').doc(phoneNumber);

  // Purchase complete now I want to store the user's data
  await user_ref.set({
    customer_id: customer.id,
    customer_email: customer.email,
    customer_name: customer.name,
    // reset the product
    current_product: "",
  }, {merge: true});
}

async function get_user_phone(payment_link) {
  const paymentLink = await stripe.paymentLinks.retrieve(
      payment_link,
  );
  const phone_number = paymentLink.metadata.phone;
  return phone_number;
}

async function handlePurchase(session) {
  // Here you should handle the purchase. This function is just a placeholder.
  const user_email = session.customer_details.email;
  const user_name = session.customer_details.name;
  const user_phone = await get_user_phone(session.payment_link);
  const customer = await create_customer(user_name, user_email, user_phone);
  await store_data(customer, user_phone);
}

module.exports = {postStripe};
