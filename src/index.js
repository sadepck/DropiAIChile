const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const requireAuth = require('./middlewares/auth.middleware');
const stripeWebhookController = require('./controllers/webhook.controller');
const { generateResponse } = require('./controllers/ai.controller');
const { createCheckoutSession, createPortalSession } = require('./controllers/payment.controller');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookController);

app.use(express.json());

app.post('/api/payments/create-checkout', requireAuth, createCheckoutSession);
app.post('/api/payments/customer-portal', requireAuth, createPortalSession);
app.post('/api/ai/generate', requireAuth, generateResponse);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Backend del SaaS operando al 100% 🚀' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor profesional corriendo en http://localhost:${PORT}`);
});
