const stripe = require('stripe')('sk_test_51ORH1oCUveDWoBMaDE7JPwXOWNa9CIPQTiaWx3AXG05O9q4I2Ev6jwOP59f4zE1cpH84jC4NEq4aBiMGRHzWJnzM00mJCTwQx5');

async function get_price_id(product_id) {
  // ToDo: get the price id of the product id
  const prices = await stripe.prices.list({product: product_id});
  return prices.data[0].id;
}

const generatePaymentLink = async (phoneNumber, product_id) => {
  try {
    const price_id = await get_price_id(product_id);
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
    });
    return paymentLink;
  } catch (error) {
    console.error("Error generating link:", error.response ? error.response.data : error.message);
  }
};

module.exports = {generatePaymentLink};
