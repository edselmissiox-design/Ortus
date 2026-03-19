const BIZ_SYSTEM = `You are Ortus Business AI — a world-class strategic consultant combining the analytical rigour of McKinsey, the financial precision of Goldman Sachs, and the strategic vision of a seasoned entrepreneur. Generate powerful, detailed, ready-to-use business prompts and frameworks. Be structured, actionable and professional. Always use clear headers and sections.`

const BRAND_SYSTEM = `You are Ortus Brand AI — a world-class creative director combining the visual intelligence of a top branding agency, the cultural intuition of a trend forecaster, and the expressive power of an award-winning copywriter. Generate powerful, creative, emotionally resonant brand prompts. Be bold, distinctive and inspiring. Always use clear headers and sections.`

const BUILDER_SYSTEM = `You are Ortus Builder AI — the world's most powerful AI web developer and designer. You build complete, production-ready websites and applications.

CRITICAL RULES:
- Always output COMPLETE, working code — never partial or placeholder code
- Make designs absolutely stunning — world-class, agency-quality
- Use Google Fonts for beautiful typography
- Make everything fully responsive for mobile, tablet and desktop
- Add smooth animations, hover effects and micro-interactions
- Use CSS gradients and shapes instead of placeholder images
- Always include: navigation, hero, features/content sections, CTA, footer
- For Full Stack: include complete HTML/CSS/JS frontend AND Supabase backend code
- Code must work perfectly when copied into a file
- Be extremely detailed and thorough
- Start with a 2-line description, then output the complete code`

const KNOWLEDGE_SYSTEM = `You are Ortus Knowledge AI — the most intelligent research and knowledge system ever built. You have deep expertise in:
- The universe, cosmology, quantum physics, space and time
- History, philosophy, science, mathematics
- Business, economics, technology, culture
- Any topic a human could ask about

Rules:
- Give comprehensive, accurate, deeply researched answers
- Use clear structure with headers and sections
- Cite relevant theories, scientists, thinkers and sources
- Make complex topics accessible and fascinating
- Always go deeper than expected — surprise with insight
- Connect ideas across disciplines
- Be the most knowledgeable assistant imaginable`

const CATEGORY_CONTEXT = {
  biz: {
    'Business Plan': 'Create a comprehensive business plan framework',
    'Financial Model': 'Build a detailed financial model and projections',
    'Marketing Campaign': 'Design a complete full-funnel marketing campaign',
    'Investor Pitch': 'Craft a compelling investor pitch narrative',
    'SOP & Process': 'Build a detailed standard operating procedure',
    'Market Research': 'Conduct deep market research and analysis',
    'Growth Strategy': 'Build a complete growth and scaling strategy'
  },
  brand: {
    'Brand Identity': 'Develop a complete brand identity brief',
    'Social Content': 'Create a 30-day social media content strategy',
    'Ad Copy': 'Write high-converting advertising copy',
    'Brand Voice': 'Define complete brand voice and tone guidelines',
    'Visual Direction': 'Write a detailed visual creative direction brief',
    'Launch Strategy': 'Design a complete product or brand launch strategy',
    'Email Campaign': 'Write a complete email marketing campaign'
  },
  builder: {
    'Landing Page': 'Build a stunning, conversion-optimised landing page',
    'Business Website': 'Build a complete multi-section business website',
    'Portfolio': 'Build a beautiful portfolio website',
    'E-commerce': 'Build a complete online store with product pages',
    'App UI': 'Build a complete app interface with all screens',
    'Dashboard': 'Build a beautiful data dashboard UI',
    'Full Stack App': 'Build complete frontend AND Supabase backend code'
  },
  knowledge: {
    'Universe & Space': 'Deep research on cosmology, space and the universe',
    'Science & Physics': 'Comprehensive scientific knowledge and research',
    'History & Philosophy': 'Deep historical and philosophical research',
    'Technology & AI': 'Latest in technology, AI and future trends',
    'Business & Economy': 'Deep business and economic research',
    'Mathematics': 'Mathematical concepts, proofs and applications',
    'Health & Biology': 'Comprehensive health, biology and medicine research'
  }
}

export const generatePrompt = async (userMessage, mode, category) => {
  let systemPrompt
  if (mode === 'biz') systemPrompt = BIZ_SYSTEM
  else if (mode === 'brand') systemPrompt = BRAND_SYSTEM
  else if (mode === 'builder') systemPrompt = BUILDER_SYSTEM
  else systemPrompt = KNOWLEDGE_SYSTEM

  const categoryHint = CATEGORY_CONTEXT[mode]?.[category] || ''

  let userContent
  if (mode === 'builder') {
    userContent = `Build Request: ${userMessage}
Category: ${category}
Task: ${categoryHint}

${category === 'Full Stack App' ? `Please provide:
1. Complete HTML/CSS/JavaScript frontend code
2. Complete Supabase database schema (SQL)
3. Complete JavaScript backend functions
4. Step-by-step deployment instructions

Make it production-ready and stunning.` : `Please provide the complete, working HTML/CSS/JavaScript code.
Make it absolutely stunning with animations and modern design.
The code must work perfectly when saved as a .html file.`}`
  } else if (mode === 'knowledge') {
    userContent = `Research Topic: ${userMessage}
Category: ${category}
Task: ${categoryHint}

Please provide a comprehensive, deeply researched response. Go beyond surface level. Include relevant theories, examples, connections to other fields, and surprising insights. Be thorough and fascinating.`
  } else {
    userContent = `Category: ${category}
Task: ${categoryHint}

Request: ${userMessage}

Generate a powerful, complete, professional ${mode === 'biz' ? 'business framework' : 'brand strategy'}. Use clear headers and sections. Be extremely thorough and actionable.`
  }

  const messages = [{ role: 'user', content: userContent }]

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
