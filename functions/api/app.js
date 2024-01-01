const express = require('express');
const cors = require('cors');
const webhookRoutes = require('./routes/webhook_routes');
const textingRoutes = require('./routes/texting_routes');
const stripeRoutes = require('./routes/stripe_routes');
const shopifyRoutes = require('./routes/shopify_routes');


const app = express();
app.use(cors({origin: true}));
// Callable using https://us-central1-your-project-id.cloudfunctions.net/webhook
app.use('/', webhookRoutes);
// Callabe using https://us-central1-your-project-id.cloudfunctions.net/webhook/texting
app.use('/texting', textingRoutes);
app.use('/stripe', stripeRoutes);
app.use('/shopify', shopifyRoutes);


module.exports = app;
