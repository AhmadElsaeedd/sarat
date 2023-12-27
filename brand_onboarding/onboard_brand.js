const stripe = require('stripe')('sk_test_51ORH1oCUveDWoBMaDE7JPwXOWNa9CIPQTiaWx3AXG05O9q4I2Ev6jwOP59f4zE1cpH84jC4NEq4aBiMGRHzWJnzM00mJCTwQx5');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

// Function to create a product and its price in Stripe
async function createProductAndPrice(productName, productDescription, price) {
  try {
    // Create a product
    const product = await stripe.products.create({
      name: productName,
      description: productDescription,
    });

    // Create a price for the product
    // Note: Convert price from USD format to integer (cents)
    const priceInCents = parseInt(parseFloat(price.replace('$', '')) * 100);
    await stripe.prices.create({
      unit_amount: priceInCents,
      currency: 'usd',
      product: product.id,
    });

    console.log(`Product created: ${productName} with price: ${price}`);
  } catch (error) {
    console.error(`Error creating product: ${productName}`, error);
  }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

// Function to read CSV and create products
async function readCSVAndCreateProducts(filePath) {
    const content = fs.readFileSync(filePath);
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });
  
    for (const record of records) {
      await createProductAndPrice(record['Product Name'], record['Product Description'], record['Price']);
      await delay(5000); // Delay of 1 second (1000 milliseconds) between each API call
    }
  }

// Replace with your CSV file path
const filePath = 'brand1.csv';
readCSVAndCreateProducts(filePath);
