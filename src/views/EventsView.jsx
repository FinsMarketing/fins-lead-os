import { useState } from 'react'
import { Zap, Loader, Trash2, ExternalLink, Plus } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY } from '../brand'
import { Btn, Field, Modal } from '../components/Shared'
import { upsertEvent, deleteEvent } from '../lib/db'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

const EMPTY = { name:'', date:'', location:'', description:'', url:'' }

export default function EventsView({ events, setEvents, reps, role }) {
  const [url,      setUrl]      = useState('')
  const [scraping, setScraping] = useState(false)
  const [err,      setErr]      = useState('')
  const [pending,  setPending]  = useState(null)
  const [confirm,  setConfirm]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [manualModal, setManualModal] = useState(false)
  const [manualForm,  setManualForm]  = useState({ ...EMPTY })
  const isAdmin = role === 'admin'
  const mf = k => v => setManualForm(p => ({ ...p, [k]: v }))

  const doScrape = async () => {
    if (!url.trim()) return
    setScraping(true); setErr('')
    try {
      const res = await fetch('/api/scrape-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPending({ id: uid(), url: url.trim(), name: data.name || '', date: data.date || '', location: data.location || '', description: data.description || '', assignedReps: [] })
      setConfirm(true); setUrl('')
    } catch {
      setErr("Couldn't pull details — add manually instead.")
    } finally { setScraping(false) }
  }

  const confirmSave = async () => {
    setSaving(true)
    try {
      const saved = await upsertEvent(pending)
      setEvents(prev => [saved, ...prev])
      setConfirm(false); setPending(null)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const saveManual = async () => {
    if (!manualForm.name) return
    setSaving(true)
    try {
      const saved = await upsertEvent({ ...manualForm, id: uid(), assignedReps: [] })
      setEvents(prev => [saved, ...prev])
      setManualModal(false); setManualForm({ ...EMPTY })
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const toggleRep = async (evt, repName) => {
    const arr = evt.assignedReps || []
    const updated = { ...evt, assignedReps: arr.includes(repName) ? arr.filter(r => r !== repName) : [...arr, repName] }
    try {
      const saved = await upsertEvent(updated)
      setEvents(prev => prev.map(e => e.id === saved.id ? saved : e))
    } catch (e) { console.error(e) }
  }

  const del = async id => {
    try {
      await deleteEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      {isAdmin && (
        <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 20, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={13} style={{ color: B.mid }} />
              <span style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 18, letterSpacing: '0.08em' }}>AI EVENT SCRAPER</span>
            </div>
            <Btn onClick={() => { setManualForm({ ...EMPTY }); setManualModal(true) }}><Plus size={13} /> ADD MANUALLY</Btn>
          </div>
          <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY, marginBottom: 14 }}>Paste any event link — name, date and location extracted automatically</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && doScrape()}
              placeholder='https://eventbrite.com.au/e/… or any event page'
              style={{ flex: 1, background: B.card, border: `1px solid ${B.border}`, borderRadius: 4, padding: '9px 13px', color: B.bone, fontSize: 14, fontFamily: FONT_BODY, outline: 'none' }} />
            <Btn onClick={doScrape} disabled={scraping || !url.trim()}>
              {scraping ? <><Loader size={12} style={{ animation: 'spin 0.9s linear infinite' }} /> SCRAPING…</> : <><Zap size={12} /> SCRAPE</>}
            </Btn>
          </div>
          {err && <div style={{ color: '#FCA5A5', fontSize: 12, fontFamily: FONT_BODY, marginTop: 8 }}>{err}</div>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {events.length === 0 && (
          <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: '40px 0', textAlign: 'center', color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>
            {isAdmin ? 'No events yet — paste a URL above or add manually' : 'No events added yet'}
          </div>
        )}
        {events.map(evt => (
          <div key={evt.id} style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: '0.05em' }}>{(evt.name || 'Untitled Event').toUpperCase()}</div>
                {evt.description && <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY, marginTop: 4, lineHeight: 1.5 }}>{evt.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {evt.url && <a href={evt.url} target='_blank' rel='noopener noreferrer' style={{ display: 'flex', alignItems: 'center', color: B.mid, padding: 6, background: B.card, border: `1px solid ${B.border}`, borderRadius: 4, textDecoration: 'none' }}><ExternalLink size={12} /></a>}
                {isAdmin && <Btn variant='danger' size='sm' onClick={() => del(evt.id)}><Trash2 size={11} /></Btn>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 14 }}>
              {evt.date     && <span style={{ color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>📅 {evt.date}</span>}
              {evt.location && <span style={{ color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>📍 {evt.location}</span>}
            </div>
            <div>
              <div style={{ color: B.mid, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT_BODY, marginBottom: 8 }}>
                ASSIGNED REPS {(evt.assignedReps || []).length > 0 ? `— ${(evt.assignedReps || []).length}` : ''}
              </div>
              {reps.length === 0
                ? <div style={{ color: B.border, fontSize: 12, fontFamily: FONT_BODY }}>{isAdmin ? 'Add reps in Settings' : 'No reps assigned'}</div>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {reps.map(rep => {
                      const on = (evt.assignedReps || []).includes(rep.name)
                      return (
                        <button key={rep.id} onClick={() => isAdmin && toggleRep(evt, rep.name)} style={{
                          background: on ? 'rgba(245,242,237,0.08)' : 'transparent',
                          border: `1px solid ${on ? 'rgba(245,242,237,0.3)' : B.border}`,
                          borderRadius: 3, padding: '4px 12px',
                          color: on ? B.bone : B.mid, fontSize: 11, fontWeight: 700,
                          fontFamily: FONT_BODY, cursor: isAdmin ? 'pointer' : 'default',
                          letterSpacing: '0.04em',
                        }}>{rep.name}</button>
                      )
                    })}
                  </div>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Manual Add Modal */}
      {manualModal && (
        <Modal title='Add Event' onClose={() => setManualModal(false)}>
          <Field label='Event Name' value={manualForm.name} onChange={mf('name')} required placeholder='Networking Night Sydney' />
          <Field label='Date'       value={manualForm.date} onChange={mf('date')}     placeholder='15 July 2026' />
          <Field label='Location'   value={manualForm.location} onChange={mf('location')} placeholder='Venue or city' />
          <Field label='URL'        value={manualForm.url}  onChange={mf('url')}      placeholder='https://… (optional)' />
          <Field label='Description' value={manualForm.description} onChange={mf('description')} type='textarea' placeholder='Brief description…' />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Btn variant='ghost' onClick={() => setManualModal(false)}>CANCEL</Btn>
            <Btn onClick={saveManual} disabled={!manualForm.name || saving}>{saving ? 'SAVING…' : 'SAVE EVENT'}</Btn>
          </div>
        </Modal>
      )}

      {/* Scraper Confirm Modal */}
      {confirm && pending && (
        <Modal title='Confirm Event Details' onClose={() => { setConfirm(false); setPending(null) }}>
          <div style={{ background: 'rgba(245,242,237,0.04)', border: `1px solid rgba(245,242,237,0.1)`, borderRadius: 4, padding: 12, marginBottom: 18 }}>
            <div style={{ color: B.mid, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT_BODY, marginBottom: 4 }}>Auto-extracted — edit if needed</div>
            <div style={{ color: B.mid, fontSize: 11, fontFamily: FONT_BODY, wordBreak: 'break-all' }}>{pending.url}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div style={{ gridColumn: 'span 2' }}><Field label='Event Name' value={pending.name} onChange={v => setPending(p => ({ ...p, name: v }))} /></div>
            <Field label='Date'     value={pending.date}     onChange={v => setPending(p => ({ ...p, date: v }))}     placeholder='15 July 2026' />
            <Field label='Location' value={pending.location} onChange={v => setPending(p => ({ ...p, location: v }))} placeholder='Venue or city' />
            <div style={{ gridColumn: 'span 2' }}><Field label='Description' value={pending.description} onChange={v => setPending(p => ({ ...p, description: v }))} type='textarea' /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Btn variant='ghost' onClick={() => { setConfirm(false); setPending(null) }}>CANCEL</Btn>
            <Btn onClick={confirmSave} disabled={saving}>{saving ? 'SAVING…' : 'SAVE EVENT'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
