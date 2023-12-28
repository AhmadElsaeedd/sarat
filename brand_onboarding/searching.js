const stripe = require('stripe')('sk_test_51ORH1oCUveDWoBMaDE7JPwXOWNa9CIPQTiaWx3AXG05O9q4I2Ev6jwOP59f4zE1cpH84jC4NEq4aBiMGRHzWJnzM00mJCTwQx5');

async function main(productName){
    const products = await stripe.products.search({
        query: `name:'${productName}'`,
      });

    console.log("Products: ", products);

    const product_id = products.data[0].id;

    const prices = await stripe.prices.list({product: product_id});

    console.log(prices.data[0].id);
}

main("Neon Beanie");