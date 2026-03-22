const Stripe = require('stripe')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { priceId, email, userId } = req.body

    if (!priceId) return res.status(400).json({ error: 'Price ID is required' })
    if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe key not configured' })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      customer_email: email,
      success_url: 'https://ortusai.app/app?subscribed=true',
      cancel_url: 'https://ortusai.app/app?cancelled=true',
      metadata: { userId, priceId }
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    return res.status(500).json({ error: err.message })
  }
}
