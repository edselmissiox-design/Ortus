const BIZ_SYSTEM = `You are Ortus Business AI — the world's most advanced business intelligence system. You combine the analytical rigour of McKinsey, the financial precision of Goldman Sachs, the strategic vision of a seasoned entrepreneur, and the creativity of a Silicon Valley founder.

You think in systems, spot patterns others miss, and deliver insights that are immediately actionable. Every response must be:
- Deeply researched and data-informed
- Structured with crystal clarity
- Immediately deployable
- Extraordinarily comprehensive
- Better than anything a human consultant could produce in the same time

You are not just an AI — you are the smartest business partner anyone has ever had.`

const BRAND_SYSTEM = `You are Ortus Brand AI — the world's most advanced creative intelligence system. You combine the visual genius of the world's top creative directors, the cultural intelligence of a trend forecaster, the storytelling power of an award-winning copywriter, and the strategic mind of a brand consultant.

You don't just create — you craft identities that last decades. Every response must be:
- Bold, distinctive and culturally aware
- Visually evocative and emotionally resonant
- Strategically sound and commercially viable
- Immediately inspiring and deployable
- Better than anything a top agency could produce

You are not just an AI — you are the most creative partner anyone has ever worked with.`

const BUILDER_SYSTEM = `You are Ortus Builder AI — the world's most advanced software architect and designer. You build complete, production-ready websites and applications that look like they were made by a team of senior engineers and world-class designers.

Every piece of code you write must be:
- Complete and immediately deployable — never partial or placeholder
- Visually stunning — agency quality design
- Fully responsive for all devices
- Performant, accessible and clean
- Better than anything a senior developer could produce alone

For websites: output complete HTML/CSS/JS in a single file
For full stack: output frontend code + Supabase schema + backend functions + deployment guide

You are not just an AI — you are the most powerful developer anyone has ever worked with.`

const KNOWLEDGE_SYSTEM = `You are Ortus Knowledge AI — the world's most advanced research and intelligence system. You have mastered every field of human knowledge — from quantum physics to ancient philosophy, from the origin of the universe to the future of technology.

Every response must be:
- Deeply researched and scientifically accurate
- Connecting ideas across multiple disciplines
- Revealing insights that surprise and illuminate
- Accessible yet profound
- Going far beyond what any search engine could provide

You don't just answer questions — you expand minds. You are not just an AI — you are the greatest teacher and researcher anyone has ever encountered.`

const CATEGORY_CONTEXT = {
  biz: {
    'Business Plan': 'Create a comprehensive, investor-ready business plan',
    'Financial Model': 'Build a detailed financial model with projections and scenarios',
    'Marketing Campaign': 'Design a complete full-funnel marketing campaign',
    'Investor Pitch': 'Craft a compelling, fundable investor pitch narrative',
    'SOP & Process': 'Build a detailed standard operating procedure',
    'Market Research': 'Conduct deep market research and competitive analysis',
    'Growth Strategy': 'Build a complete growth and scaling strategy'
  },
  brand: {
    'Brand Identity': 'Develop a complete, distinctive brand identity system',
    'Social Content': 'Create a comprehensive social media content strategy',
    'Ad Copy': 'Write high-converting, emotionally resonant advertising copy',
    'Brand Voice': 'Define a complete brand voice, tone and language system',
    'Visual Direction': 'Write a detailed visual creative direction brief',
    'Launch Strategy': 'Design a complete product or brand launch strategy',
    'Email Campaign': 'Write a complete, high-converting email marketing campaign'
  },
  builder: {
    'Landing Page': 'Build a stunning, conversion-optimised landing page',
    'Business Website': 'Build a complete, professional business website',
    'Portfolio': 'Build a beautiful, impressive portfolio website',
    'E-commerce': 'Build a complete online store with product pages',
    'App UI': 'Build a complete, polished app interface',
    'Dashboard': 'Build a beautiful, functional data dashboard',
    'Full Stack App': 'Build complete frontend AND Supabase backend with all code'
  },
  knowledge: {
    'Universe & Space': 'Deep research on cosmology, space, time and the universe',
    'Science & Physics': 'Comprehensive scientific knowledge and breakthrough research',
    'History & Philosophy': 'Deep historical context and philosophical wisdom',
    'Technology & AI': 'Latest in technology, AI, and the future of humanity',
    'Business & Economy': 'Deep business strategy and economic intelligence',
    'Mathematics': 'Mathematical concepts, elegant proofs and real applications',
    'Health & Biology': 'Comprehensive health, biology and medical knowledge'
  }
}

// Context memory — stores conversation history
let conversationHistory = []

export const resetConversation = () => {
  conversationHistory = []
}

export const generatePrompt = async (userMessage, mode, category, useMemory = true) => {
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

${category === 'Full Stack App' ? `Deliver:
1. Complete HTML/CSS/JavaScript frontend
2. Complete Supabase SQL schema
3. Complete JavaScript API functions
4. Step-by-step deployment guide

Make it production-ready, stunning and complete.` : `Deliver the complete, working HTML/CSS/JavaScript code.
Make it absolutely stunning — world-class design with smooth animations.
Must work perfectly when saved as a .html file.`}`
  } else if (mode === 'knowledge') {
    userContent = `Research: ${userMessage}
Category: ${category}
Task: ${categoryHint}

Deliver a comprehensive, deeply researched response. Go far beyond surface level. Include relevant theories, groundbreaking research, real-world examples, connections across disciplines, and insights that genuinely surprise. Be thorough, accurate and fascinating.`
  } else {
    userContent = `Category: ${category}
Task: ${categoryHint}

Request: ${userMessage}

Deliver a comprehensive, complete ${mode === 'biz' ? 'business framework' : 'brand strategy'}. Use clear headers and sections. Be extraordinarily thorough, actionable and immediately deployable.`
  }

  // Build messages with conversation memory
  const newMessage = { role: 'user', content: userContent }

  let messages
  if (useMemory && conversationHistory.length > 0) {
    // Keep last 6 exchanges for context (12 messages)
    const recentHistory = conversationHistory.slice(-12)
    messages = [...recentHistory, newMessage]
  } else {
    messages = [newMessage]
  }

  try {
    // Use self-review for non-builder modes (builder already generates long responses)
    const selfReview = mode !== 'builder'

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        system: systemPrompt,
        mode,
        selfReview
      })
    })

    if (!response.ok) throw new Error('API request failed')
    const data = await response.json()
    const result = data.content[0].text

    // Save to conversation memory
    conversationHistory.push(newMessage)
    conversationHistory.push({ role: 'assistant', content: result })

    return result
  } catch (err) {
    console.error('AI Error:', err)
    throw new Error('Failed to generate. Please check your API key.')
  }
}
