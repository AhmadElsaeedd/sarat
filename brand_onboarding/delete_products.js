const stripe = require('stripe')('sk_test_51ORH1oCUveDWoBMaDE7JPwXOWNa9CIPQTiaWx3AXG05O9q4I2Ev6jwOP59f4zE1cpH84jC4NEq4aBiMGRHzWJnzM00mJCTwQx5');

// Function to deactivate all prices for a given product
async function deactivateAllPrices(productId) {
  const prices = await stripe.prices.list({ product: productId, active: true });

  for (const price of prices.data) {
    await stripe.prices.update(price.id, { active: false });
    console.log(`Deactivated price: ${price.id}`);
  }
}

// Function to deactivate prices and delete all products
async function deactivatePricesAndDeleteProducts() {
  try {
    const products = await stripe.products.list({ limit: 100 });

    for (const product of products.data) {
      await deactivateAllPrices(product.id);
      await stripe.products.del(product.id);
      console.log(`Deleted product: ${product.id}`);
    }

    console.log('All products have been deleted, and their prices have been deactivated.');
  } catch (error) {
    console.error('Error:', error);
  }
}

deactivatePricesAndDeleteProducts();
