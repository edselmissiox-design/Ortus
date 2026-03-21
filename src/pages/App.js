const fetch = require('node-fetch')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  try {
    const { messages, system, mode } = req.body

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: system,
        messages: messages
      })
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    let result = data.content[0].text

    // For builder mode - ensure code is properly wrapped
    if (mode === 'builder') {
      if (!result.includes('```html') && result.includes('<!DOCTYPE')) {
        result = '```html\n' + result + '\n```'
      } else if (!result.includes('```html') && result.includes('<html')) {
        result = '```html\n' + result + '\n```'
      }
    }

    return res.status(200).json({
      content: [{ type: 'text', text: result }]
    })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
