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
    const { messages, system, mode, selfReview } = req.body

    // STEP 1: Chain of Thought — think before answering
    const thinkingSystem = `${system}

CRITICAL THINKING PROTOCOL:
Before answering, you must think through these steps internally:
1. What exactly is being asked?
2. What are the key requirements?
3. What would a world-class expert do here?
4. What are the potential pitfalls to avoid?
5. What would make this response exceptional?

Then deliver your best possible response based on that thinking.
Always be comprehensive, precise and extraordinarily helpful.`

    // STEP 1: Generate initial response
    const initialResponse = await callClaude(apiKey, messages, thinkingSystem, 2000)

    if (!selfReview) {
      return res.status(200).json({ content: [{ type: 'text', text: initialResponse }] })
    }

    // STEP 2: Self-review and improve
    const reviewMessages = [
      ...messages,
      { role: 'assistant', content: initialResponse },
      {
        role: 'user',
        content: `Review your response above with these criteria:
1. Is it complete and comprehensive?
2. Is it accurate and well-structured?
3. Does it fully address what was asked?
4. Can any section be significantly improved?
5. Is the output immediately actionable?

If the response scores less than 9/10 on any criterion, rewrite and improve it.
If it scores 9/10 or above on all criteria, respond with exactly: "APPROVED: " followed by the original response.
Either way, output the final best version.`
      }
    ]

    const reviewedResponse = await callClaude(apiKey, reviewMessages, system, 2000)

    // Extract final response
    const finalResponse = reviewedResponse.startsWith('APPROVED: ')
      ? reviewedResponse.replace('APPROVED: ', '')
      : reviewedResponse

    return res.status(200).json({
      content: [{ type: 'text', text: finalResponse }],
      selfReviewed: true
    })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function callClaude(apiKey, messages, system, maxTokens) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages
    })
  })
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.content[0].text
}
