const BIZ_SYSTEM = `You are Ortus Business AI — a world-class strategic consultant. Generate powerful, detailed, ready-to-use business prompts and frameworks. Be structured, actionable and professional.`

const BRAND_SYSTEM = `You are Ortus Brand AI — a world-class creative director. Generate powerful, creative, emotionally resonant brand prompts. Be bold, distinctive and inspiring.`

const BUILDER_SYSTEM = `You are Ortus Builder AI — a world-class full-stack developer and designer. When a user describes a website or app, you generate complete, working, beautiful HTML/CSS/JavaScript code.

Rules:
- Always output COMPLETE, ready-to-use HTML files with embedded CSS and JS
- Make designs stunning, modern and professional
- Use Google Fonts for typography
- Make it fully responsive for mobile and desktop
- Add smooth animations and hover effects
- Never use placeholder images — use CSS gradients and shapes instead
- Always include a proper navigation, hero section, and footer
- Code must work by simply copying and pasting into a .html file
- Start your response with a brief description, then output the complete code between triple backticks`

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
  },
  builder: {
    'Landing Page': 'Build a stunning landing page',
    'Business Website': 'Build a complete business website',
    'Portfolio': 'Build a portfolio website',
    'E-commerce': 'Build an online store page',
    'App UI': 'Build an app interface',
    'Coming Soon': 'Build a coming soon page'
  }
}

export const generatePrompt = async (userMessage, mode, category) => {
  const systemPrompt = mode === 'biz' ? BIZ_SYSTEM : mode === 'brand' ? BRAND_SYSTEM : BUILDER_SYSTEM
  const categoryHint = CATEGORY_CONTEXT[mode]?.[category] || ''

  const messages = [
    {
      role: 'user',
      content: `Category: ${category}\nTask: ${categoryHint}\n\nRequest: ${userMessage}\n\nGenerate a powerful, complete ${mode === 'builder' ? 'website with full HTML/CSS/JS code' : 'prompt/framework'}. ${mode === 'builder' ? 'Output the complete working code.' : 'Format with clear sections.'}`
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
    throw new Error('Failed to generate. Please check your API key.')
  }
}
