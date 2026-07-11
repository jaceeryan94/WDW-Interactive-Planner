// api/download.js
//
// Gate: only serves the planner file if the given Stripe Checkout Session
// actually completed payment. Called from /public/success.html as:
//   /api/download?session_id=cs_test_...
//
// This is a lightweight gate (no database, no accounts) appropriate for a
// simple one-time-purchase product. Anyone with a *paid* session_id can
// re-download, which is normal and fine for this use case -- session ids
// are long random strings that only exist after Stripe emails/redirects
// them to the paying customer.
//
// Required environment variables:
//   STRIPE_SECRET_KEY  - same key used in create-checkout-session.js

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.status(400).send('Missing session_id.');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(402).send('Payment has not completed for this session yet.');
    }

    // planner-source/ sits OUTSIDE /public, so Vercel never serves it as a
    // static file -- the only way to get the HTML is through this function,
    // after a verified paid session.
    const filePath = path.join(__dirname, '..', 'planner-source', 'WDW_Interactive_Planner.html');
    const file = fs.readFileSync(filePath, 'utf8');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="WDW_Interactive_Planner.html"');
    res.status(200).send(file);
  } catch (err) {
    console.error('download error:', err);
    res.status(400).send('Invalid or expired session.');
  }
};
