const main_control_service = require('../services/main_control');
const stripe = require('stripe')('sk_test_51ORH1oCUveDWoBMaDE7JPwXOWNa9CIPQTiaWx3AXG05O9q4I2Ev6jwOP59f4zE1cpH84jC4NEq4aBiMGRHzWJnzM00mJCTwQx5');
const endpointSecret = 'whsec_6pijIngHHM6o1qNAPjiKOMra4CJlI7ry';

async function postStripe(req, res) {
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
