const openai_service = require('../services/openai_service');
const whatsapp_service = require('../services/whatsapp_service');
const stripe_service = require('../services/stripe_service');
const firebase_service = require('../services/firebase_service');

function get_text_type(text) {
  text = text.toLowerCase();
  if (text === "yes") return "yes";
  else if (text === "cancel") return "cancel";
  else return "other";
}

function isCreatedInLast24Hours(obj) {
  const currentTime = Math.floor(Date.now() / 1000); // current Unix timestamp in seconds
  const creationTime = obj.created; // object's creation Unix timestamp
  const diff = currentTime - creationTime;
  return diff <= 86400; // true if created in last 24 hours, false otherwise
}

async function main_control(userPhone, message) {
  try {
    const text_type = get_text_type(message);
    const current_shop = await firebase_service.get_users_conversation(userPhone);
    await firebase_service.increment_messages(current_shop, userPhone, "You", message);
    switch (text_type) {
      case "yes": {
        // ToDo: get the product's ids from firebase
        // const product_id = await firebase_service.get_product_id(userPhone);
        const stripe_product_ids = await firebase_service.get_product_ids(userPhone);
        // ToDo: see if the user is returning or is first time
        const returning_user = await firebase_service.user_has_customer_id(userPhone);
        if (!returning_user) {
        // First time user
        // Instead of a payment link, generate a checkout session with the link generated from the generate payment link function
          const checkout_session = await stripe_service.generateCheckoutSession(userPhone);
          // ToDo: pass this payment link to the whatsapp service with the phone number of the user
          await whatsapp_service.sendMessage(userPhone, null, null, null, null, null, checkout_session.url, null, null, null, "payment_link_message");
        } else {
        // Returning user
          const status = await firebase_service.get_status(userPhone);
          if (status === "succeeded" || status === "") {
          // ToDo: generate a payment intent of that user
            const payment_intent = await stripe_service.generatePaymentIntent(userPhone, stripe_product_ids);
            // ToDo: send a message to confirm the payment intent
            await whatsapp_service.sendMessage(userPhone, null, null, null, null, null, null, null, null, payment_intent.payment_method, "payment_confirmation_message");
          } else if (status === "requires_confirmation") {
            const payment_intent = await stripe_service.confirmPaymentIntent(userPhone);
            await whatsapp_service.sendMessage(userPhone, null, null, null, null, null, null, null, payment_intent.status, null, "success_message");
          }
        }
        break;
      }
      case "cancel": {
        // Handle 'cancel' text
        const user = await firebase_service.get_customer_data(userPhone);
        const user_email = user.customer_email;
        const current_payment_intent = user.current_payment_intent;
        // get the customer id of the user from stripe using their email
        const customer_id = await stripe_service.get_customer_id(user_email);
        // get the id of the last payment intent of the user
        const last_payment_intent = await stripe_service.get_last_payment_intent(customer_id);
        // make sure that the one in firebase and the one from stripe are the same
        if (current_payment_intent === last_payment_intent.id && isCreatedInLast24Hours(last_payment_intent)) {
          // refund it
          const refund_object = await stripe_service.create_refund(userPhone, last_payment_intent.id);
          await whatsapp_service.sendMessage(userPhone, null, null, null, null, null, null, refund_object.status, null, null, "refund_message");
        } else {
          await whatsapp_service.sendMessage(userPhone, null, null, null, null, null, null, null, null, null, "failed_refund");
        }
        // Handle the part where we decrement the sales volume amount when the user refunds
        break;
      }
      default: {
        // Handle other text
        const aiResponse = await openai_service.getOpenAIResponse(userPhone, message);
        // ToDo: pass this response to the whatsapp function that sends a message back to the user
        await whatsapp_service.sendMessage(userPhone, null, aiResponse, null, null, null, null, null, null, null, null);
        break;
      }
    }
  } catch (error) {
    console.error("Error in Cart Service:", error);
    throw error;
  }
}


async function handlePurchase(session) {
  const setup_intent = session.setup_intent;
  const payment_method = await stripe_service.get_payment_method(setup_intent);
  const user_email = session.customer_details.email;
  // const user_name = session.customer_details.Name;
  // const user_phone = await get_user_phone(session.payment_link);
  const user_phone = session.metadata.phone;
  const customer = await stripe_service.create_customer(user_email, user_phone, payment_method);
  await firebase_service.store_data(customer, user_phone, payment_method);
  const product_id = await firebase_service.get_product_id(user_phone);
  // create a confirmed payment intent to charge the customer
  await stripe_service.generatePaymentIntent(user_phone, product_id);
  await stripe_service.confirmPaymentIntent(user_phone);
}

module.exports = {main_control, handlePurchase};
