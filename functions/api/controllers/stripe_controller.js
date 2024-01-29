const main_control_service = require('../services/main_control');
const firebase_service = require('../services/firebase_service');
const stripe_service = require('../services/stripe_service');

async function postStripe(req, res) {
  const shop = req.body.data.object.metadata.shop;
  const secretKey = await firebase_service.get_stripe_key(shop);
  const endpointSecret = await firebase_service.get_stripe_endpoint_secret(shop);
  const stripe = stripe_service.getStripeInstance(secretKey);
  // Using the shop we can get the
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
      await main_control_service.handlePurchase(session);
      break;
    }
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({received: true});
}

module.exports = {postStripe};
