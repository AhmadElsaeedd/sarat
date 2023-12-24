const express = require('express');
const cors = require('cors');
const webhookRoutes = require('./routes/webhook_routes');


const app = express();
app.use(cors({origin: true}));
app.use(express.json()); // To parse JSON bodies
app.use('/', webhookRoutes);

module.exports = app;
