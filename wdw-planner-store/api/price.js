// api/price.js
//
// Returns the current price so the landing page can stay in sync
// with what Stripe Checkout actually charges. Reads the same
// PRICE_CENTS / CURRENCY env vars as create-checkout-session.js —
// change PRICE_CENTS in Vercel and both the checkout and the
// landing page update together.

module.exports = async (req, res) => {
  const cents = parseInt(process.env.PRICE_CENTS || '900', 10);
  const currency = (process.env.CURRENCY || 'usd').toUpperCase();

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ cents, currency, formatted });
};
