

async function get_customers_with_cohorts(abandoned_checkouts, cohorts) {
  return abandoned_checkouts.map((abandoned_checkout) => {
    // Determine the cohort for this checkout based on your conditions
    const cohort = determineCohort(abandoned_checkout, cohorts);

    // Assign the cohort to the checkout
    abandoned_checkout.cohort = cohort;

    return abandoned_checkout;
  });
}

function determineCohort(checkout, cohorts) {
  // Determine if the customer is a first time or returning customer
  const customerType = checkout.customer.orders_count === 0 ? 'first_time' : 'returning';

  // Find the cohort that matches the customer type, cart value, and number of items in cart
  const cohort = cohorts.find((cohort) => {
    const purchaseFrequencyIncludesCustomer = cohort.purchase_frequency.includes(customerType);
    const cartValueIsWithinRange = (cohort.cart_value[0] === undefined || checkout.total_price >= cohort.cart_value[0]) &&
                                       (cohort.cart_value[1] === undefined || checkout.total_price <= cohort.cart_value[1]);
    const itemsInCartIsWithinRange = (cohort.items_in_cart[0] === undefined || checkout.line_items.length >= cohort.items_in_cart[0]) &&
                                         (cohort.items_in_cart[1] === undefined || checkout.line_items.length <= cohort.items_in_cart[1]);
    return purchaseFrequencyIncludesCustomer && cartValueIsWithinRange && itemsInCartIsWithinRange;
  });

  // If no cohort matches, you might want to handle this case differently
  return cohort || null;
}

module.exports = {get_customers_with_cohorts};
