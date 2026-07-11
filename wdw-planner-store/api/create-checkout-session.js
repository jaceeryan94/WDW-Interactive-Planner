// api/create-checkout-session.js
//
// Creates a Stripe Checkout Session for a one-time purchase of the planner.
// Called by the "Buy Now" button on /public/index.html.
//
// Required environment variables (set these in Vercel Project Settings -> Environment Variables):
//   STRIPE_SECRET_KEY   - your Stripe secret key (sk_test_... while testing, sk_live_... in production)
//   PRICE_CENTS         - price in cents, e.g. 900 for $9.00 (optional, defaults to 900)
//   CURRENCY            - three-letter currency code, lowercase, e.g. "usd" (optional, defaults to "usd")
//   PRODUCT_NAME         - name shown on the Stripe Checkout page (optional)

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_CENTS = parseInt(process.env.PRICE_CENTS || '900', 10);
const CURRENCY = process.env.CURRENCY || 'usd';
const PRODUCT_NAME = process.env.PRODUCT_NAME || 'WDW Character & Lightning Lane Planner';
const PRODUCT_DESCRIPTION =
  'Interactive Walt Disney World character dining, meet & greet, and Lightning Lane planning tool. Instant download after purchase.';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Server is missing STRIPE_SECRET_KEY.' });
  }

  try {
    // Works out your site's own URL so success/cancel redirects always point
    // at wherever this is actually deployed (localhost, preview, or production).
    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            unit_amount: PRICE_CENTS,
            product_data: {
              name: PRODUCT_NAME,
              description: PRODUCT_DESCRIPTION
            }
          },
          quantity: 1
        }
      ],
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    res.status(500).json({ error: 'Unable to create checkout session.' });
  }
};
