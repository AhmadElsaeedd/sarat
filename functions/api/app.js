const express = require('express');
const cors = require('cors');
const webhookRoutes = require('./routes/webhook_routes');
const textingRoutes = require('./routes/texting_routes');
const stripeRoutes = require('./routes/stripe_routes');
const shopifyRoutes = require('./routes/shopify_routes');
const firebaseRoutes = require('./routes/firebase_routes');
const whatsappRoutes = require('./routes/whatsapp_routes');


const app = express();
app.use(cors({origin: "*"}));
// Callable using https://us-central1-your-project-id.cloudfunctions.net/webhook
app.use('/', webhookRoutes);
// Call by using https://us-central1-your-project-id.cloudfunctions.net/webhook/texting
app.use('/texting', textingRoutes);
// Call by using https://us-central1-your-project-id.cloudfunctions.net/webhook/stripe
app.use('/stripe', stripeRoutes);
// Call by using https://us-central1-your-project-id.cloudfunctions.net/webhook/shopify
app.use('/shopify', shopifyRoutes);
// Call by using https://us-central1-your-project-id.cloudfunctions.net/webhook/firebase
app.use('/firebase', firebaseRoutes);
// Call by using https://us-central1-your-project-id.cloudfunctions.net/webhook/whatsapp
app.use('/whatsapp', whatsappRoutes);


module.exports = app;
