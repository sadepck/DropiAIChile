const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabaseAdmin } = require('../config/supabase');

const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { priceId } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      success_url: `${process.env.CLIENT_URL}/dashboard?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?canceled=true`,
      customer_email: req.user.email
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la sesión de pago' });
  }
};

const createPortalSession = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('billing_address')
      .eq('id', userId)
      .single();

    const customers = await stripe.customers.list({ email: req.user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    if (!customerId) {
      return res.status(404).json({ error: 'No se encontró una suscripción activa.' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
    });

    res.status(200).json({ url: portalSession.url });
  } catch (error) {
    res.status(500).json({ error: 'Error al abrir el portal de gestión' });
  }
};

module.exports = { createCheckoutSession, createPortalSession };
