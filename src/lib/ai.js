const BIZ_SYSTEM = `You are Ortus Business AI — a world-class strategic consultant combining the analytical rigour of McKinsey, the financial precision of Goldman Sachs, and the strategic vision of a seasoned entrepreneur.

Your role is to generate powerful, detailed, ready-to-use business prompts and frameworks. Every output must be:
- Structured and actionable
- Data-informed with realistic benchmarks
- Professionally worded
- Immediately usable by the user

Always respond with a complete, formatted prompt or framework the user can take and deploy. Use clear sections with headers. Be comprehensive but not verbose.`

const BRAND_SYSTEM = `You are Ortus Brand AI — a world-class creative director combining the visual intelligence of a top branding agency, the cultural intuition of a trend forecaster, and the expressive power of an award-winning copywriter.

Your role is to generate powerful, creative, emotionally resonant brand prompts and frameworks. Every output must be:
- Bold and distinctive
- Culturally aware
- Visually evocative
- Ready to inspire real creative work

Always respond with a complete, formatted prompt or creative brief the user can deploy immediately. Use clear sections. Be imaginative, specific, and inspiring.`

const CATEGORY_CONTEXT = {
  biz: {
    'Business Plan': 'Create a comprehensive business plan framework',
    'Financial Model': 'Build a detailed financial model and projections framework',
    'Marketing Campaign': 'Design a full-funnel marketing campaign strategy',
    'Investor Pitch': 'Craft a compelling investor pitch narrative',
    'SOP & Process': 'Build a detailed standard operating procedure'
  },
  brand: {
    'Brand Identity': 'Develop a complete brand identity brief',
    'Social Content': 'Create a social media content strategy',
    'Ad Copy': 'Write high-converting advertising copy frameworks',
    'Brand Voice': 'Define brand voice, tone and language guidelines',
    'Visual Direction': 'Write a visual creative direction brief',
    'Launch Strategy': 'Design a complete brand or product launch strategy'
  }
}

export const generatePrompt = async (userMessage, mode, category) => {
  const systemPrompt = mode === 'biz' ? BIZ_SYSTEM : BRAND_SYSTEM
  const categoryHint = CATEGORY_CONTEXT[mode]?.[category] || ''

  const messages = [
    {
      role: 'user',
      content: `Category: ${category}\nTask hint: ${categoryHint}\n\nUser request: ${userMessage}\n\nGenerate a powerful, complete prompt/framework for this request. Format with clear sections and make it immediately deployable.`
    }
  ]

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages
      })
    })

    if (!response.ok) throw new Error('AI request failed')
    const data = await response.json()
    return data.content[0].text
  } catch (err) {
    console.error('AI Error:', err)
    throw new Error('Failed to generate prompt. Please check your API key.')
  }
}
