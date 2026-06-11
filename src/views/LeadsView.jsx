import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY, STAGES, SERVICES } from '../brand'
import { Badge, Btn, Field, Modal, Stat } from '../components/Shared'
import { upsertLead, deleteLead } from '../lib/db'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const today = () => new Date().toISOString().split('T')[0]
const EMPTY = { name:'', company:'', email:'', phone:'', service:'', status:'new', notes:'', followUpDate:'', source:'', assignedRep:'' }

export default function LeadsView({ leads, setLeads, role, reps, isMobile }) {
  const [search, setSearch]     = useState('')
  const [sf, setSf]             = useState('all')
  const [repFilter, setRepFilter] = useState('all')
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)
  const isAdmin = role === 'admin'
  const ff = k => v => setForm(p => ({ ...p, [k]: v }))

  const isOD = l => l.followUpDate && l.followUpDate < today() && l.status !== 'won' && l.status !== 'lost'
  const isDT = l => l.followUpDate === today() && l.status !== 'won' && l.status !== 'lost'

  const rows = leads.filter(l => {
    const s = search.toLowerCase()
    return (!s || [l.name, l.company, l.email, l.service].some(v => v?.toLowerCase().includes(s)))
      && (sf === 'all' || l.status === sf)
      && (repFilter === 'all' || l.assignedRep === repFilter || (repFilter === 'unassigned' && !l.assignedRep))
  }).sort((a, b) => isOD(a) && !isOD(b) ? -1 : !isOD(a) && isOD(b) ? 1 : 0)

  const save = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      const saved = await upsertLead(modal === 'add' ? { ...form, id: uid() } : { ...form })
      setLeads(prev => modal === 'add' ? [saved, ...prev] : prev.map(l => l.id === saved.id ? saved : l))
      setModal(null)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const del = async id => {
    try { await deleteLead(id); setLeads(prev => prev.filter(l => l.id !== id)) }
    catch (e) { console.error(e) }
  }

  const sc = k => STAGES.find(s => s.key === k) || STAGES[0]
  const inp = { background: B.card, border: `1px solid ${B.border}`, borderRadius: 4, padding: '8px 12px', color: B.bone, fontSize: 13, fontFamily: FONT_BODY, outline: 'none' }

  return (
    <div>
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          <Stat label='Total'   value={leads.length} />
          <Stat label='Due Today' value={leads.filter(isDT).length} />
          <Stat label='Overdue' value={leads.filter(isOD).length} />
          <Stat label='Won'     value={leads.filter(l => l.status === 'won').length} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 140, position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: B.mid, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search…'
            style={{ ...inp, width: '100%', padding: '8px 10px 8px 28px', boxSizing: 'border-box' }} />
        </div>
        <select value={sf} onChange={e => setSf(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
          <option value='all'>All stages</option>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={repFilter} onChange={e => setRepFilter(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
          <option value='all'>All reps</option>
          <option value='unassigned'>Unassigned</option>
          {reps.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
        {isAdmin && <Btn onClick={() => { setForm({ ...EMPTY }); setModal('add') }}><Plus size={13} /> ADD</Btn>}
      </div>

      {isMobile ? (
        // Mobile card layout
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.length === 0 && <div style={{ padding: '36px 0', textAlign: 'center', color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>No leads</div>}
          {rows.map(lead => {
            const od = isOD(lead), dt = isDT(lead)
            return (
              <div key={lead.id} style={{ background: B.surface, border: `1px solid ${od ? 'rgba(252,165,165,0.3)' : B.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {od && <AlertTriangle size={11} style={{ color: '#FCA5A5' }} />}
                      <span style={{ fontWeight: 700, color: B.bone, fontSize: 15, fontFamily: FONT_BODY }}>{lead.name}</span>
                    </div>
                    {lead.company && <div style={{ color: B.mid, fontSize: 12, marginTop: 2 }}>{lead.company}</div>}
                  </div>
                  <Badge label={sc(lead.status).label} statusKey={lead.status} type='stage' />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                  {lead.service && <span style={{ color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>{lead.service}</span>}
                  {lead.assignedRep && <span style={{ color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>👤 {lead.assignedRep}</span>}
                  {lead.followUpDate && <span style={{ fontSize: 12, fontFamily: FONT_BODY, color: od ? '#FCA5A5' : dt ? '#FDE68A' : B.mid, fontWeight: od || dt ? 700 : 400 }}>📅 {lead.followUpDate}</span>}
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn variant='ghost' size='sm' onClick={() => { setForm({ ...lead }); setModal('edit') }}><Edit2 size={11} /> Edit</Btn>
                    <Btn variant='danger' size='sm' onClick={() => del(lead.id)}><Trash2 size={11} /> Delete</Btn>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        // Desktop table layout
        <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${B.border}` }}>
                {['Contact', 'Service', 'Stage', 'Rep', 'Follow-up', 'Source', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: B.mid, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT_BODY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} style={{ padding: '36px 0', textAlign: 'center', color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>No leads</td></tr>}
              {rows.map(lead => {
                const od = isOD(lead), dt = isDT(lead)
                return (
                  <tr key={lead.id} style={{ borderBottom: `1px solid ${B.border}` }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        {od && <AlertTriangle size={11} style={{ color: '#FCA5A5', marginTop: 2 }} />}
                        <div>
                          <div style={{ fontWeight: 700, color: B.bone, fontSize: 14, fontFamily: FONT_BODY }}>{lead.name}</div>
                          {lead.company && <div style={{ color: B.mid, fontSize: 12 }}>{lead.company}</div>}
                          {lead.email   && <div style={{ color: B.mid, fontSize: 12 }}>{lead.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>{lead.service || '—'}</td>
                    <td style={{ padding: '13px 16px' }}><Badge label={sc(lead.status).label} statusKey={lead.status} type='stage' /></td>
                    <td style={{ padding: '13px 16px', color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>{lead.assignedRep || '—'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      {lead.followUpDate ? <span style={{ fontSize: 12, fontFamily: FONT_BODY, color: od ? '#FCA5A5' : dt ? '#FDE68A' : B.mid, fontWeight: od || dt ? 700 : 400 }}>{lead.followUpDate}</span>
                        : <span style={{ color: B.border }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>{lead.source || '—'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      {isAdmin && <div style={{ display: 'flex', gap: 6 }}>
                        <Btn variant='ghost' size='sm' onClick={() => { setForm({ ...lead }); setModal('edit') }}><Edit2 size={11} /></Btn>
                        <Btn variant='danger' size='sm' onClick={() => del(lead.id)}><Trash2 size={11} /></Btn>
                      </div>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && isAdmin && (
        <Modal title={modal === 'add' ? 'New Lead' : 'Edit Lead'} onClose={() => setModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 12px' }}>
            <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}><Field label='Full Name' value={form.name || ''} onChange={ff('name')} required placeholder='Jane Smith' /></div>
            <Field label='Company'     value={form.company || ''}     onChange={ff('company')}     placeholder='Smith Pty Ltd' />
            <Field label='Email'       value={form.email || ''}       onChange={ff('email')}       placeholder='jane@company.com' />
            <Field label='Phone'       value={form.phone || ''}       onChange={ff('phone')}       placeholder='+61 400 000 000' />
            <Field label='Service'     value={form.service || ''}     onChange={ff('service')}     options={SERVICES} />
            <Field label='Stage'       value={form.status || 'new'}   onChange={ff('status')}      options={STAGES.map(s => ({ key: s.key, label: s.label }))} />
            <Field label='Assigned Rep' value={form.assignedRep || ''} onChange={ff('assignedRep')} options={reps.map(r => ({ key: r.name, label: r.name }))} />
            <Field label='Follow-up'   value={form.followUpDate || ''} onChange={ff('followUpDate')} type='date' />
            <Field label='Source'      value={form.source || ''}      onChange={ff('source')}      placeholder='Event, referral, LinkedIn…' />
            <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}><Field label='Notes' value={form.notes || ''} onChange={ff('notes')} type='textarea' placeholder='Context…' /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Btn variant='ghost' onClick={() => setModal(null)}>CANCEL</Btn>
            <Btn onClick={save} disabled={!form.name || saving}>{saving ? 'SAVING…' : 'SAVE'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
