const openai_service = require('../services/openai_service');
const whatsapp_service = require('../services/whatsapp_service');
const stripe_service = require('../services/stripe_service');
const firebase_service = require('../services/firebase_service');

function is_text_handleable(text) {
  if (text.toLowerCase() === "yes") return true;
  else return false;
}

async function main_control(userPhone, message) {
  try {
    const handle_text = is_text_handleable(message);

    if (handle_text) {
      // ToDo: get the product's id
      const product_id = await firebase_service.get_product_id(userPhone);
      // ToDo: see if the user is returning or is first time
      const returning_user = await firebase_service.user_has_customer_id(userPhone);
      if (!returning_user) {
        // First time user
        // Instead of a payment link, generate a checkout session with the link generated from the generate payment link function
        const checkout_session = await stripe_service.generateCheckoutSession(userPhone, product_id);
        // ToDo: pass this payment link to the whatsapp service with the phone number of the user
        await whatsapp_service.sendPaymentLinkMessage(userPhone, checkout_session.url);
      } else {
        // Returning user
        const status = await firebase_service.get_status(userPhone);
        if (status === "succeeded" || status === "") {
          // ToDo: generate a payment intent of that user
          const payment_intent = await stripe_service.generatePaymentIntent(userPhone, product_id);
          // ToDo: send a message to confirm the payment intent
          await whatsapp_service.sendConfirmationMessage(userPhone, payment_intent.payment_method);
        } else if (status === "requires_confirmation") {
          const payment_intent = await stripe_service.confirmPaymentIntent(userPhone);
          await whatsapp_service.sendSuccessMessage(userPhone, payment_intent.status);
        }
        // Returning user
      }
    } else {
      const aiResponse = await openai_service.getOpenAIResponse(userPhone, message);
      // ToDo: pass this response to the whatsapp function that sends a message back to the user
      await whatsapp_service.sendMessage(userPhone, aiResponse);
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
  console.log("I am creating a payment intent");
  await stripe_service.generatePaymentIntent(user_phone, product_id);
  await stripe_service.confirmPaymentIntent(user_phone);
  console.log("Payment intent confirmed");
}

module.exports = {main_control, handlePurchase};
