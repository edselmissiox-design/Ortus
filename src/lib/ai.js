const BIZ_SYSTEM = `You are Ortus Business AI — a world-class strategic consultant. Generate powerful, detailed, ready-to-use business prompts and frameworks. Be structured, actionable and professional.`

const BRAND_SYSTEM = `You are Ortus Brand AI — a world-class creative director. Generate powerful, creative, emotionally resonant brand prompts. Be bold, distinctive and inspiring.`

const CATEGORY_CONTEXT = {
  biz: {
    'Business Plan': 'Create a comprehensive business plan framework',
    'Financial Model': 'Build a detailed financial model',
    'Marketing Campaign': 'Design a full-funnel marketing campaign',
    'Investor Pitch': 'Craft a compelling investor pitch',
    'SOP & Process': 'Build a standard operating procedure'
  },
  brand: {
    'Brand Identity': 'Develop a complete brand identity brief',
    'Social Content': 'Create a social media content strategy',
    'Ad Copy': 'Write high-converting ad copy frameworks',
    'Brand Voice': 'Define brand voice and tone guidelines',
    'Visual Direction': 'Write a visual creative direction brief',
    'Launch Strategy': 'Design a complete launch strategy'
  }
}

export const generatePrompt = async (userMessage, mode, category) => {
  const systemPrompt = mode === 'biz' ? BIZ_SYSTEM : BRAND_SYSTEM
  const categoryHint = CATEGORY_CONTEXT[mode]?.[category] || ''

  const messages = [
    {
      role: 'user',
      content: `Category: ${category}\nTask: ${categoryHint}\n\nRequest: ${userMessage}\n\nGenerate a powerful, complete prompt/framework. Format with clear sections.`
    }
  ]

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, system: systemPrompt })
    })

    if (!response.ok) throw new Error('API request failed')
    const data = await response.json()
    return data.content[0].text
  } catch (err) {
    console.error('AI Error:', err)
    throw new Error('Failed to generate prompt. Please check your API key.')
  }
}
