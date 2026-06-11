# FINS Lead OS

Internal CRM, payment tracker, and event management for FINS Marketing Co.

**Stack:** React + Vite · Supabase (database) · Netlify (hosting + serverless functions)

---

## Setup (15 minutes total)

### 1. Supabase — create your database

1. Go to [supabase.com](https://supabase.com) → New project
2. Name it `fins-lead-os`, pick the closest region (Sydney = ap-southeast-2)
3. Once created: **SQL Editor → New Query**
4. Paste the entire contents of `supabase/schema.sql` and click **Run**
5. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon public` key

### 2. Local development

```bash
# Clone / download this project, then:
npm install

# Copy the example env file
cp .env.example .env

# Fill in your Supabase values
# VITE_SUPABASE_URL=https://your-ref.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

npm run dev
# → http://localhost:5173
```

Default login: admin PIN = `fins` · rep code = `reps`
Change both immediately in Settings after first login.

### 3. Deploy to Netlify

**Option A — GitHub (recommended)**
1. Push this project to a GitHub repo
2. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
3. Select your repo — build settings are auto-detected from `netlify.toml`
4. Add environment variables in Netlify → Site settings → Environment variables:
   ```
   VITE_SUPABASE_URL        = your Supabase project URL
   VITE_SUPABASE_ANON_KEY   = your Supabase anon key
   ANTHROPIC_API_KEY        = your Anthropic API key (for AI event scraper)
   ```
5. Deploy — done

**Option B — Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set VITE_SUPABASE_URL "https://your-ref.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
netlify env:set ANTHROPIC_API_KEY "sk-ant-..."
netlify deploy --prod
```

### 4. Custom domain

In Netlify → Domain settings → Add custom domain: `app.finsmarketingco.com`

Then add a CNAME record at your DNS provider:
```
Type:  CNAME
Name:  app
Value: your-netlify-site.netlify.app
```

### 5. Add to home screen (PWA)

- **iPhone:** open `app.finsmarketingco.com` in Safari → Share → Add to Home Screen
- **Android:** open in Chrome → three dots → Add to Home Screen

---

## Access

| Role  | PIN/Code | Access |
|-------|----------|--------|
| Admin | Set in Settings | Everything — leads, payments, events, rep form, settings |
| Rep   | Set in Settings | Leads (read-only), events (read-only), rep form (submit) |

---

## Project structure

```
fins-lead-os/
├── netlify/
│   └── functions/
│       └── scrape-event.js   ← AI event scraper (serverless, API key stays server-side)
├── supabase/
│   └── schema.sql            ← Run this once in Supabase SQL editor
├── src/
│   ├── lib/
│   │   ├── supabase.js       ← Supabase client
│   │   ├── db.js             ← All database operations
│   │   └── scraper.js        ← Calls the Netlify function
│   ├── views/                ← One file per section
│   ├── components/
│   │   └── Shared.jsx        ← Badge, Btn, Field, Modal, Stat
│   ├── brand.js              ← Colour tokens, fonts, constants
│   └── App.jsx               ← Shell, routing, data loading
├── .env.example              ← Copy to .env, fill in values
└── netlify.toml              ← Build config
```
