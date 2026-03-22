module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { html } = req.body
    if (!html) return res.status(400).send('No HTML provided')

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('X-Frame-Options', 'ALLOWALL')
    res.setHeader('Content-Security-Policy', 'default-src * data: blob: \'unsafe-inline\' \'unsafe-eval\'')
    return res.status(200).send(html)
  } catch (err) {
    return res.status(500).send('Error: ' + err.message)
  }
}
