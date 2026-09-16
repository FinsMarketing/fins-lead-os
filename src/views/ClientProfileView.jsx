import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Trash2, Plus, ExternalLink, Edit2, TrendingUp } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY, SERVICES } from '../brand'
import { Btn, Field, Modal, Stat, Badge } from '../components/Shared'
import { upsertClient, deleteClient, fetchClientFiles, upsertClientFile, deleteClientFile, fetchClientMetrics, upsertClientMetric, deleteClientMetric } from '../lib/db'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const fmtAUD = n => `$${Number(n || 0).toLocaleString('en-AU')}`

const TABS = ['Overview', 'Dashboards', 'Metrics', 'Files', 'P&L', 'Login']
const STATUS = [{ key:'active', label:'Active' }, { key:'paused', label:'Paused' }, { key:'churned', label:'Churned' }]
const DASH_PLATFORMS = [
  { key:'dashMeta',       label:'Meta Ads' },
  { key:'dashGoogleAds',  label:'Google Ads' },
  { key:'dashGa4',        label:'GA4 (Website)' },
  { key:'dashShopify',    label:'Shopify' },
  { key:'dashYoutube',    label:'YouTube' },
  { key:'dashEmail',      label:'Email (Klaviyo/Mailchimp)' },
]

export default function ClientProfileView({ client, onBack, onUpdate, payments, boardTasks, isMobile }) {
  const [tab, setTab] = useState('Overview')
  const [form, setForm] = useState({ ...client })
  const [saving, setSaving] = useState(false)
  const [files, setFiles] = useState([])
  const [metrics, setMetrics] = useState([])
  const [fileModal, setFileModal] = useState(null)
  const [fileForm, setFileForm] = useState({})
  const [metricModal, setMetricModal] = useState(null)
  const [metricForm, setMetricForm] = useState({})
  const ff = k => v => setForm(p => ({ ...p, [k]: v }))
  const fmf = k => v => setFileForm(p => ({ ...p, [k]: v }))
  const mmf = k => v => setMetricForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    fetchClientFiles(client.id).then(setFiles).catch(console.error)
    fetchClientMetrics(client.id).then(setMetrics).catch(console.error)
  }, [client.id])

  const save = async () => {
    setSaving(true)
    try {
      const saved = await upsertClient(form)
      onUpdate(saved)
      setForm(saved)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const removeClient = async () => {
    if (!confirm(`Delete client "${client.name}"? This cannot be undone.`)) return
    try { await deleteClient(client.id); onUpdate(null); onBack() }
    catch (e) { console.error(e) }
  }

  const saveFile = async () => {
    if (!fileForm.title || !fileForm.url) return
    try {
      const isNew = fileModal === 'add'
      const saved = await upsertClientFile({ ...fileForm, clientId: client.id, id: isNew ? uid() : fileForm.id })
      setFiles(prev => isNew ? [...prev, saved] : prev.map(f => f.id === saved.id ? saved : f))
      setFileModal(null); setFileForm({})
    } catch (e) { console.error(e) }
  }

  const removeFile = async id => {
    if (!confirm('Delete this file link?')) return
    try { await deleteClientFile(id); setFiles(prev => prev.filter(f => f.id !== id)) }
    catch (e) { console.error(e) }
  }

  const saveMetric = async () => {
    if (!metricForm.month) return
    try {
      const isNew = metricModal === 'add'
      const saved = await upsertClientMetric({ ...metricForm, clientId: client.id, id: isNew ? uid() : metricForm.id })
      setMetrics(prev => {
        const idx = prev.findIndex(m => m.id === saved.id)
        const next = idx >= 0 ? prev.map(m => m.id === saved.id ? saved : m) : [...prev, saved]
        return next.sort((a, b) => (a.month || '').localeCompare(b.month || ''))
      })
      setMetricModal(null); setMetricForm({})
    } catch (e) { console.error(e) }
  }

  const removeMetric = async id => {
    if (!confirm('Delete this month\'s metrics?')) return
    try { await deleteClientMetric(id); setMetrics(prev => prev.filter(m => m.id !== id)) }
    catch (e) { console.error(e) }
  }

  // P&L calc
  const clientPayments = payments.filter(p => p.clientName === client.name)
  const revenue = clientPayments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const clientTasks = boardTasks.filter(t => t.clientName === client.name && t.paid)
  const cost = clientTasks.reduce((s, t) => s + Number(t.price || 0), 0)
  const profit = revenue - cost

  // Files grouped by section
  const grouped = files.reduce((acc, f) => {
    const sec = f.section || 'Other'
    if (!acc[sec]) acc[sec] = []
    acc[sec].push(f)
    return acc
  }, {})

  const activeDashes = DASH_PLATFORMS.filter(p => form[p.key])

  const inp = { background: B.card, border: `1px solid ${B.border}`, borderRadius: 4, padding: '9px 12px', color: B.bone, fontSize: 13, fontFamily: FONT_BODY, outline: 'none' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Btn variant='ghost' size='sm' onClick={onBack}><ArrowLeft size={12} /> BACK</Btn>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 28, letterSpacing: '0.06em', lineHeight: 1 }}>{client.name.toUpperCase()}</div>
        </div>
        <Btn variant='danger' size='sm' onClick={removeClient}><Trash2 size={12} /> DELETE</Btn>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', borderBottom: `1px solid ${B.border}`, paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '10px 14px', color: tab === t ? B.bone : B.mid,
            fontFamily: FONT_DISPLAY, fontSize: 14, letterSpacing: '0.1em',
            borderBottom: `2px solid ${tab === t ? B.bone : 'transparent'}`,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 12px' }}>
            <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}><Field label='Profile Picture URL' value={form.profilePic || ''} onChange={ff('profilePic')} placeholder='https://…' /></div>
            <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}><Field label='Company Name' value={form.name || ''} onChange={ff('name')} required /></div>
            <Field label='Contact Name' value={form.contactName || ''} onChange={ff('contactName')} />
            <Field label='Email' value={form.email || ''} onChange={ff('email')} />
            <Field label='Phone' value={form.phone || ''} onChange={ff('phone')} />
            <Field label='Website' value={form.website || ''} onChange={ff('website')} placeholder='https://…' />
            <Field label='Service' value={form.service || ''} onChange={ff('service')} options={SERVICES} />
            <Field label='Status' value={form.status || 'active'} onChange={ff('status')} options={STATUS.map(s => ({ key: s.key, label: s.label }))} />
            <Field label='Monthly Value (AUD)' value={form.monthlyValue || ''} onChange={ff('monthlyValue')} type='number' />
            <Field label='Start Date' value={form.startDate || ''} onChange={ff('startDate')} type='date' />
            <Field label='Instagram' value={form.instagram || ''} onChange={ff('instagram')} placeholder='@handle' />
            <Field label='TikTok' value={form.tiktok || ''} onChange={ff('tiktok')} placeholder='@handle' />
            <Field label='Facebook' value={form.facebook || ''} onChange={ff('facebook')} placeholder='facebook.com/…' />
            <Field label='LinkedIn' value={form.linkedin || ''} onChange={ff('linkedin')} placeholder='linkedin.com/…' />
            <Field label='YouTube' value={form.youtubeHandle || ''} onChange={ff('youtubeHandle')} placeholder='@handle' />
            <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}><Field label='Brief' value={form.brief || ''} onChange={ff('brief')} type='textarea' placeholder='What they do, goals, target audience, tone of voice…' /></div>
            <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}><Field label='Internal Notes' value={form.notes || ''} onChange={ff('notes')} type='textarea' /></div>
          </div>
          <Btn onClick={save} disabled={saving}><Save size={12} /> {saving ? 'SAVING…' : 'SAVE CHANGES'}</Btn>
        </div>
      )}

      {tab === 'Dashboards' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY, marginBottom: 20 }}>
            Paste the share URL from each platform. Only platforms with a URL will appear in the client's portal.
          </div>
          {DASH_PLATFORMS.map(p => (
            <Field key={p.key} label={p.label} value={form[p.key] || ''} onChange={ff(p.key)} placeholder='https://…' />
          ))}
          <Btn onClick={save} disabled={saving}><Save size={12} /> {saving ? 'SAVING…' : 'SAVE CHANGES'}</Btn>
        </div>
      )}

      {tab === 'Metrics' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>Monthly numbers you enter, shown as a graph in the client portal</span>
            <Btn size='sm' onClick={() => { setMetricForm({ month: new Date().toISOString().slice(0, 7) }); setMetricModal('add') }}><Plus size={12} /> ADD MONTH</Btn>
          </div>
          {metrics.length === 0 ? (
            <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: '30px 0', textAlign: 'center', color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>No metrics recorded yet</div>
          ) : (
            <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${B.border}` }}>
                    {['Month', 'IG Followers', 'IG Reach', 'TT Followers', 'TT Views', 'FB Followers', 'FB Reach', 'Site Views', 'Meta Ads', 'Google Ads', ''].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: B.mid, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT_BODY, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map(m => (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${B.border}` }}>
                      <td style={{ padding: '10px 12px', color: B.bone, fontSize: 12, fontFamily: FONT_BODY, whiteSpace: 'nowrap' }}>{m.month}</td>
                      <td style={{ padding: '10px 12px', color: B.mid, fontSize: 12 }}>{m.instagramFollowers || '—'}</td>
                      <td style={{ padding: '10px 12px', color: B.mid, fontSize: 12 }}>{m.instagramReach || '—'}</td>
                      <td style={{ padding: '10px 12px', color: B.mid, fontSize: 12 }}>{m.tiktokFollowers || '—'}</td>
                      <td style={{ padding: '10px 12px', color: B.mid, fontSize: 12 }}>{m.tiktokViews || '—'}</td>
                      <td style={{ padding: '10px 12px', color: B.mid, fontSize: 12 }}>{m.facebookFollowers || '—'}</td>
                      <td style={{ padding: '10px 12px', color: B.mid, fontSize: 12 }}>{m.facebookReach || '—'}</td>
                      <td style={{ padding: '10px 12px', color: B.mid, fontSize: 12 }}>{m.websiteViews || '—'}</td>
                      <td style={{ padding: '10px 12px', color: B.mid, fontSize: 12 }}>{m.metaAdViews || '—'}</td>
                      <td style={{ padding: '10px 12px', color: B.mid, fontSize: 12 }}>{m.googleAdViews || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Btn variant='ghost' size='sm' onClick={() => { setMetricForm({ ...m }); setMetricModal('edit') }}><Edit2 size={10} /></Btn>
                          <Btn variant='danger' size='sm' onClick={() => removeMetric(m.id)}><Trash2 size={10} /></Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'Files' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>File links organized by section. Mark internal to hide from client.</span>
            <Btn size='sm' onClick={() => { setFileForm({ section: '', title: '', url: '', internal: false }); setFileModal('add') }}><Plus size={12} /> ADD FILE</Btn>
          </div>
          {Object.keys(grouped).length === 0 ? (
            <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: '30px 0', textAlign: 'center', color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>No files added yet</div>
          ) : (
            Object.entries(grouped).map(([section, sf]) => (
              <div key={section} style={{ marginBottom: 20 }}>
                <div style={{ color: B.mid, fontFamily: FONT_DISPLAY, fontSize: 16, letterSpacing: '0.08em', marginBottom: 8 }}>{section.toUpperCase()}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sf.map(f => (
                    <div key={f.id} style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <a href={f.url} target='_blank' rel='noopener noreferrer' style={{ flex: 1, color: B.bone, textDecoration: 'none', fontSize: 13, fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <ExternalLink size={12} style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</span>
                      </a>
                      {f.internal && <Badge label='Internal' statusKey='new' type='stage' />}
                      <Btn variant='ghost' size='sm' onClick={() => { setFileForm({ ...f }); setFileModal('edit') }}><Edit2 size={10} /></Btn>
                      <Btn variant='danger' size='sm' onClick={() => removeFile(f.id)}><Trash2 size={10} /></Btn>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'P&L' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            <Stat label='Revenue (Paid)' value={fmtAUD(revenue)} />
            <Stat label='Cost (Staff Paid)' value={fmtAUD(cost)} />
            <Stat label='Profit' value={fmtAUD(profit)} />
          </div>
          <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 20 }}>
            <div style={{ color: B.mid, fontSize: 12, fontFamily: FONT_BODY, marginBottom: 8 }}>
              Revenue = sum of paid payments from {client.name}. Cost = sum of paid staff tasks for {client.name}. Profit = Revenue - Cost.
            </div>
            <div style={{ color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>
              {clientPayments.length} payment(s) tracked · {clientTasks.length} paid staff task(s)
            </div>
          </div>
        </div>
      )}

      {tab === 'Login' && (
        <div style={{ maxWidth: 500 }}>
          <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY, marginBottom: 20 }}>
            Set the login credentials the client will use to access their portal. Message this to the client separately.
          </div>
          <Field label='Client Login Email' value={form.loginEmail || ''} onChange={ff('loginEmail')} type='email' placeholder='client@company.com' />
          <Field label='Client Login Password' value={form.loginPassword || ''} onChange={ff('loginPassword')} placeholder='At least 6 characters' />
          <Btn onClick={save} disabled={saving}><Save size={12} /> {saving ? 'SAVING…' : 'SAVE CREDENTIALS'}</Btn>
        </div>
      )}

      {fileModal && (
        <Modal title={fileModal === 'add' ? 'Add File' : 'Edit File'} onClose={() => setFileModal(null)}>
          <Field label='Section (e.g. Content Plans, Logins)' value={fileForm.section || ''} onChange={fmf('section')} placeholder='Content Plans' />
          <Field label='Title' value={fileForm.title || ''} onChange={fmf('title')} required placeholder='June 2026 Content Plan' />
          <Field label='URL' value={fileForm.url || ''} onChange={fmf('url')} required placeholder='https://…' />
          <div style={{ marginBottom: 14 }}>
            <button onClick={() => setFileForm(p => ({ ...p, internal: !p.internal }))} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: fileForm.internal ? B.bone : B.border, position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 14, height: 14, borderRadius: 7, background: fileForm.internal ? B.ink : B.mid, position: 'absolute', top: 3, left: fileForm.internal ? 19 : 3, transition: 'left 0.2s' }} />
              </div>
              <span style={{ color: B.mid, fontSize: 12, fontFamily: FONT_BODY, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Internal only (hide from client)</span>
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Btn variant='ghost' onClick={() => setFileModal(null)}>CANCEL</Btn>
            <Btn onClick={saveFile} disabled={!fileForm.title || !fileForm.url}>SAVE</Btn>
          </div>
        </Modal>
      )}

      {metricModal && (
        <Modal title={metricModal === 'add' ? 'Add Month' : 'Edit Month'} onClose={() => setMetricModal(null)}>
          <Field label='Month (YYYY-MM)' value={metricForm.month || ''} onChange={mmf('month')} required placeholder='2026-06' />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Field label='Instagram Followers' value={metricForm.instagramFollowers || ''} onChange={mmf('instagramFollowers')} type='number' />
            <Field label='Instagram Reach' value={metricForm.instagramReach || ''} onChange={mmf('instagramReach')} type='number' />
            <Field label='TikTok Followers' value={metricForm.tiktokFollowers || ''} onChange={mmf('tiktokFollowers')} type='number' />
            <Field label='TikTok Views' value={metricForm.tiktokViews || ''} onChange={mmf('tiktokViews')} type='number' />
            <Field label='Facebook Followers' value={metricForm.facebookFollowers || ''} onChange={mmf('facebookFollowers')} type='number' />
            <Field label='Facebook Reach' value={metricForm.facebookReach || ''} onChange={mmf('facebookReach')} type='number' />
            <Field label='Website Views' value={metricForm.websiteViews || ''} onChange={mmf('websiteViews')} type='number' />
            <Field label='Meta Ad Views' value={metricForm.metaAdViews || ''} onChange={mmf('metaAdViews')} type='number' />
            <Field label='Google Ad Views' value={metricForm.googleAdViews || ''} onChange={mmf('googleAdViews')} type='number' />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Btn variant='ghost' onClick={() => setMetricModal(null)}>CANCEL</Btn>
            <Btn onClick={saveMetric} disabled={!metricForm.month}>SAVE</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
