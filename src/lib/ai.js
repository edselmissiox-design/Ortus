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

MANDATORY OUTPUT FORMAT — FOLLOW THIS EXACTLY EVERY TIME:
1. Write ONE sentence describing what you built
2. Then immediately output the complete code like this:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
... your complete code here ...
</html>
\`\`\`

CRITICAL RULES:
- ALWAYS wrap code in triple backticks starting with \`\`\`html
- NEVER output code without the backtick wrapper
- NEVER split into multiple code blocks
- ALWAYS output complete working code — never partial
- Make designs absolutely stunning — world class agency quality
- Use Google Fonts for beautiful typography
- Make fully responsive for mobile and desktop
- Add smooth animations and hover effects
- Use CSS gradients instead of placeholder images
- Always include navigation, hero, content sections and footer`

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
    'Landing Page': 'Build a stunning, conversion-optimised landing page with complete HTML/CSS/JS',
    'Business Website': 'Build a complete, professional business website with HTML/CSS/JS',
    'Portfolio': 'Build a beautiful, impressive portfolio website with HTML/CSS/JS',
    'E-commerce': 'Build a complete online store with product pages using HTML/CSS/JS',
    'App UI': 'Build a complete, polished app interface with HTML/CSS/JS',
    'Dashboard': 'Build a beautiful, functional data dashboard with HTML/CSS/JS',
    'Full Stack App': 'Build complete frontend HTML/CSS/JS AND Supabase backend with all code'
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
    userContent = `Build this for me: ${userMessage}

Category: ${category}
Task: ${categoryHint}

IMPORTANT: You MUST output the complete code wrapped in triple backticks starting with \`\`\`html
Do not output anything else except one sentence description then the complete HTML code block.

${category === 'Full Stack App' ? `Include:
1. Complete HTML/CSS/JavaScript frontend
2. Complete Supabase SQL schema
3. Complete JavaScript API functions  
4. Deployment guide` : `Output the complete, stunning, fully working HTML/CSS/JavaScript in a single file.`}`
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

  const newMessage = { role: 'user', content: userContent }

  let messages
  if (useMemory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-12)
    messages = [...recentHistory, newMessage]
  } else {
    messages = [newMessage]
  }

  try {
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

    conversationHistory.push(newMessage)
    conversationHistory.push({ role: 'assistant', content: result })

    return result
  } catch (err) {
    console.error('AI Error:', err)
    throw new Error('Failed to generate. Please check your API key.')
  }
}
