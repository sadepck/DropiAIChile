require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabaseAdmin } = require('../config/supabase');

const stripeWebhookController = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`❌ Error de firma en el Webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        console.log(`💰 Pago exitoso de: ${session.customer_email}`);
        
        const userId = session.client_reference_id || 'dbe25dbe-cfb2-4023-8c9a-f4018755e69e'; 

        if (userId) {
          const { error } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
              id: session.subscription || session.id,
              user_id: userId,
              status: 'active',
              price_id: session.metadata?.price_id || 'default_price',
              created: new Date().toISOString(),
            });

          if (error) {
            console.error('❌ Supabase rechazó el guardado:', error.message);
          } else {
            console.log(`✅ Suscripción guardada REALMENTE para el usuario ${userId}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .match({ id: subscription.id });
        console.log(`🔄 Suscripción actualizada: ${subscription.id} - Estado: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled' })
          .match({ id: subscription.id });
        console.log(`🚫 Suscripción cancelada: ${subscription.id}`);
        break;
      }

      default:
        console.log(`👉 Evento no manejado: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ Error actualizando la base de datos de Supabase:', error);
    return res.status(500).send('Error interno manejando el evento de Stripe');
  }

  res.status(200).json({ received: true });
};

module.exports = stripeWebhookController;
