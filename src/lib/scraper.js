// Calls the Netlify serverless function which holds the Anthropic API key securely
export async function scrapeEvent(url) {
  const res = await fetch('/api/scrape-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) throw new Error('Scrape request failed')
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}
