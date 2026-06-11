// Netlify Serverless Function — AI Event Scraper
// Keeps the Anthropic API key server-side, never exposed to the browser

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { url } = await req.json()
    if (!url) return new Response('URL required', { status: 400 })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Visit this event URL: ${url}

Return ONLY a raw JSON object, no markdown, no explanation:
{"name":"event name","date":"date as found on page","location":"venue or city","description":"1-2 sentence summary"}

Use null for any field you cannot find.`
        }]
      })
    })

    const data = await response.json()
    const text = data.content?.find(b => b.type === 'text')?.text || ''
    const match = text.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Could not parse response')

    return new Response(match[0], {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const config = { path: '/api/scrape-event' }
