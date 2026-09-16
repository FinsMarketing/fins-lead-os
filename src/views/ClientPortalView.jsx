import { useState, useEffect } from 'react'
import { LogOut, ExternalLink, TrendingUp } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY } from '../brand'
import { fetchClientFiles, fetchClientMetrics } from '../lib/db'

const DASH_PLATFORMS = [
  { key:'dashMeta',       label:'Meta Ads' },
  { key:'dashGoogleAds',  label:'Google Ads' },
  { key:'dashGa4',        label:'Website (GA4)' },
  { key:'dashShopify',    label:'Shopify' },
  { key:'dashYoutube',    label:'YouTube' },
  { key:'dashEmail',      label:'Email' },
]

// Simple SVG line chart component
function LineChart({ data, label, height = 160 }) {
  if (!data.length) return null
  const values = data.map(d => d.value).filter(v => v != null && !isNaN(v))
  if (values.length === 0) return <div style={{ padding: 20, color: B.mid, fontSize: 12, textAlign: 'center' }}>No data</div>

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const width = 100
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width
    const y = height - ((d.value - min) / range) * (height - 40) - 20
    return `${x},${y}`
  }).join(' ')

  return (
    <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 4, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: B.bone, fontSize: 12, fontWeight: 700, fontFamily: FONT_BODY, letterSpacing: '0.05em' }}>{label.toUpperCase()}</span>
        <span style={{ color: B.mid, fontSize: 11, fontFamily: FONT_BODY }}>Latest: {values[values.length - 1]?.toLocaleString()}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio='none' style={{ width: '100%', height: height }}>
        <polyline fill='none' stroke={B.bone} strokeWidth='0.5' points={points} vectorEffect='non-scaling-stroke' />
        {data.map((d, i) => {
          const x = (i / Math.max(data.length - 1, 1)) * width
          const y = height - ((d.value - min) / range) * (height - 40) - 20
          return <circle key={i} cx={x} cy={y} r='1' fill={B.bone} />
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {data.filter((_, i) => i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)).map((d, i) => (
          <span key={i} style={{ color: B.mid, fontSize: 10, fontFamily: FONT_BODY }}>{d.month}</span>
        ))}
      </div>
    </div>
  )
}

export default function ClientPortalView({ client, onLogout, isMobile }) {
  const [tab, setTab] = useState('overview')
  const [files, setFiles] = useState([])
  const [metrics, setMetrics] = useState([])
  const [activeDash, setActiveDash] = useState(null)

  useEffect(() => {
    fetchClientFiles(client.id).then(all => setFiles(all.filter(f => !f.internal))).catch(console.error)
    fetchClientMetrics(client.id).then(setMetrics).catch(console.error)
  }, [client.id])

  const activeDashes = DASH_PLATFORMS.filter(p => client[p.key])
  useEffect(() => { if (!activeDash && activeDashes.length > 0) setActiveDash(activeDashes[0].key) }, [activeDashes.length])

  const TABS = ['overview']
  if (activeDashes.length > 0) TABS.push('dashboards')
  if (metrics.length > 0)       TABS.push('metrics')
  if (files.length > 0)         TABS.push('files')

  const socials = [
    { label: 'Website', url: client.website, icon: '🌐' },
    { label: 'Instagram', url: client.instagram, icon: '📷' },
    { label: 'TikTok', url: client.tiktok, icon: '🎵' },
    { label: 'Facebook', url: client.facebook, icon: '👥' },
    { label: 'LinkedIn', url: client.linkedin, icon: '💼' },
    { label: 'YouTube', url: client.youtubeHandle, icon: '▶️' },
  ].filter(s => s.url)

  // Group files by section
  const grouped = files.reduce((acc, f) => {
    const s = f.section || 'Files'
    if (!acc[s]) acc[s] = []
    acc[s].push(f)
    return acc
  }, {})

  // Metric graphs
  const METRIC_KEYS = [
    { key: 'instagramFollowers', label: 'Instagram Followers' },
    { key: 'instagramReach',     label: 'Instagram Reach' },
    { key: 'tiktokFollowers',    label: 'TikTok Followers' },
    { key: 'tiktokViews',        label: 'TikTok Views' },
    { key: 'facebookFollowers',  label: 'Facebook Followers' },
    { key: 'facebookReach',      label: 'Facebook Reach' },
    { key: 'websiteViews',       label: 'Website Views' },
    { key: 'metaAdViews',        label: 'Meta Ad Views' },
    { key: 'googleAdViews',      label: 'Google Ad Views' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: B.ink, fontFamily: FONT_BODY, color: B.bone }}>
      <div style={{ background: B.surface, borderBottom: `1px solid ${B.border}`, padding: isMobile ? '14px 16px' : '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {client.profilePic && <img src={client.profilePic} alt='' style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />}
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: '0.08em', color: B.bone }}>{client.name.toUpperCase()}</div>
            <div style={{ color: B.mid, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Client Portal · Powered by FINS</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border: 'none', color: B.mid, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: FONT_BODY }}>
          <LogOut size={12} /> {!isMobile && 'SIGN OUT'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 0, padding: isMobile ? '0 16px' : '0 32px', borderBottom: `1px solid ${B.border}`, overflowX: 'auto', background: B.surface }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '14px 16px', color: tab === t ? B.bone : B.mid,
            fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: '0.1em',
            borderBottom: `2px solid ${tab === t ? B.bone : 'transparent'}`,
            whiteSpace: 'nowrap',
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ flex: 1, padding: isMobile ? '20px 16px' : '30px 32px', maxWidth: 1100, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {tab === 'overview' && (
          <div>
            {client.brief && (
              <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 20, marginBottom: 16 }}>
                <div style={{ color: B.mid, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Brief</div>
                <div style={{ color: B.bone, fontSize: 14, fontFamily: FONT_BODY, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{client.brief}</div>
              </div>
            )}
            {socials.length > 0 && (
              <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 20 }}>
                <div style={{ color: B.mid, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Links</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {socials.map(s => (
                    <a key={s.label} href={s.url.startsWith('http') ? s.url : `https://${s.url}`} target='_blank' rel='noopener noreferrer' style={{ color: B.bone, textDecoration: 'none', fontSize: 13, padding: '8px 12px', background: B.card, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: B.mid, minWidth: 90, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.url}</span>
                      <ExternalLink size={12} style={{ color: B.mid }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'dashboards' && (
          <div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
              {activeDashes.map(p => (
                <button key={p.key} onClick={() => setActiveDash(p.key)} style={{
                  background: activeDash === p.key ? 'rgba(245,242,237,0.08)' : 'transparent',
                  border: `1px solid ${activeDash === p.key ? 'rgba(245,242,237,0.25)' : B.border}`,
                  borderRadius: 4, padding: '7px 14px', cursor: 'pointer',
                  color: activeDash === p.key ? B.bone : B.mid, fontSize: 12, fontWeight: 700,
                  fontFamily: FONT_BODY, letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>{p.label}</button>
              ))}
            </div>
            {activeDash && client[activeDash] && (
              <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, overflow: 'hidden', height: 'calc(100vh - 260px)', minHeight: 500 }}>
                <iframe src={client[activeDash]} style={{ width: '100%', height: '100%', border: 'none' }} title={activeDash} />
              </div>
            )}
          </div>
        )}

        {tab === 'metrics' && (
          <div>
            {METRIC_KEYS.map(m => {
              const data = metrics.map(mo => ({ month: mo.month, value: mo[m.key] })).filter(d => d.value != null)
              if (data.length === 0) return null
              return <LineChart key={m.key} data={data} label={m.label} />
            })}
          </div>
        )}

        {tab === 'files' && (
          <div>
            {Object.entries(grouped).map(([section, sf]) => (
              <div key={section} style={{ marginBottom: 20 }}>
                <div style={{ color: B.mid, fontFamily: FONT_DISPLAY, fontSize: 16, letterSpacing: '0.08em', marginBottom: 8 }}>{section.toUpperCase()}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sf.map(f => (
                    <a key={f.id} href={f.url} target='_blank' rel='noopener noreferrer' style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: '12px 16px', color: B.bone, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ExternalLink size={12} style={{ color: B.mid, flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{f.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
