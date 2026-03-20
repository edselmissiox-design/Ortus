const fetch = require('node-fetch')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { htmlCode, siteName } = req.body

    // Create a zip file with the HTML
    const boundary = '----FormBoundary' + Math.random().toString(36)
    
    // Deploy to Netlify via their API
    const response = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NETLIFY_TOKEN}`
      },
      body: JSON.stringify({
        name: siteName || 'ortus-build-' + Date.now()
      })
    })

    const site = await response.json()
    if (!site.id) throw new Error('Failed to create site')

    // Deploy the HTML file
    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/zip',
        'Authorization': `Bearer ${process.env.NETLIFY_TOKEN}`
      },
      body: Buffer.from(htmlCode)
    })

    const deploy = await deployResponse.json()

    return res.status(200).json({
      url: `https://${site.subdomain}.netlify.app`,
      deployId: deploy.id,
      siteId: site.id
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
