import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY, SERVICES } from '../brand'
import { Badge, Btn, Field, Modal, Stat } from '../components/Shared'
import { upsertClient, deleteClient } from '../lib/db'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const fmtAUD = n => `$${Number(n || 0).toLocaleString('en-AU')}`
const EMPTY = { name:'', contactName:'', email:'', phone:'', service:'', monthlyValue:'', startDate:'', notes:'', status:'active' }
const STATUS = [{ key:'active', label:'Active', col:'#6EE7B7' }, { key:'paused', label:'Paused', col:'#FDE68A' }, { key:'churned', label:'Churned', col:'#888580' }]

export default function ClientsView({ clients, setClients }) {
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState({})
  const [saving, setSaving] = useState(false)
  const ff = k => v => setForm(p => ({ ...p, [k]: v }))

  const mrr = clients.filter(c => c.status === 'active').reduce((a, c) => a + Number(c.monthlyValue || 0), 0)
  const active = clients.filter(c => c.status === 'active').length

  const save = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      const toSave = modal === 'add' ? { ...form, id: uid(), createdAt: new Date().toISOString() } : { ...form }
      const saved = await upsertClient(toSave)
      setClients(prev => modal === 'add' ? [saved, ...prev] : prev.map(c => c.id === saved.id ? saved : c))
      setModal(null)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const del = async id => {
    try { await deleteClient(id); setClients(prev => prev.filter(c => c.id !== id)) }
    catch (e) { console.error(e) }
  }

  const sc = k => STATUS.find(s => s.key === k) || STATUS[0]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        <Stat label='Active Clients' value={active} />
        <Stat label='Monthly Revenue' value={fmtAUD(mrr)} />
        <Stat label='Annual Run Rate' value={fmtAUD(mrr * 12)} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Btn onClick={() => { setForm({ ...EMPTY }); setModal('add') }}><Plus size={13} /> ADD CLIENT</Btn>
      </div>

      <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${B.border}` }}>
              {['Client', 'Service', 'Monthly Value', 'Status', 'Since', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: B.mid, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT_BODY }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && <tr><td colSpan={6} style={{ padding: '36px 0', textAlign: 'center', color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>No clients yet</td></tr>}
            {clients.map(c => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${B.border}` }}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ fontWeight: 700, color: B.bone, fontSize: 14, fontFamily: FONT_BODY }}>{c.name}</div>
                  {c.contactName && <div style={{ color: B.mid, fontSize: 12 }}>{c.contactName}</div>}
                  {c.email && <div style={{ color: B.mid, fontSize: 12 }}>{c.email}</div>}
                </td>
                <td style={{ padding: '13px 16px', color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>{c.service || '—'}</td>
                <td style={{ padding: '13px 16px', color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: '0.04em' }}>{c.monthlyValue ? fmtAUD(c.monthlyValue) : '—'}</td>
                <td style={{ padding: '13px 16px' }}><Badge label={sc(c.status).label} statusKey={c.status} type='client' /></td>
                <td style={{ padding: '13px 16px', color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>{c.startDate || '—'}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn variant='ghost' size='sm' onClick={() => { setForm({ ...c }); setModal('edit') }}><Edit2 size={11} /></Btn>
                    <Btn variant='danger' size='sm' onClick={() => del(c.id)}><Trash2 size={11} /></Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'New Client' : 'Edit Client'} onClose={() => setModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div style={{ gridColumn: 'span 2' }}><Field label='Company / Client Name' value={form.name || ''} onChange={ff('name')} required placeholder='Maxim Education' /></div>
            <Field label='Contact Name'   value={form.contactName || ''} onChange={ff('contactName')} placeholder='John Smith' />
            <Field label='Email'          value={form.email || ''}       onChange={ff('email')}       placeholder='john@company.com' />
            <Field label='Phone'          value={form.phone || ''}       onChange={ff('phone')}       placeholder='+61 400 000 000' />
            <Field label='Service'        value={form.service || ''}     onChange={ff('service')}     options={SERVICES} />
            <Field label='Monthly Value (AUD)' value={form.monthlyValue || ''} onChange={ff('monthlyValue')} type='number' placeholder='3000' />
            <Field label='Start Date'     value={form.startDate || ''}   onChange={ff('startDate')}   type='date' />
            <Field label='Status'         value={form.status || 'active'} onChange={ff('status')}     options={STATUS.map(s => ({ key: s.key, label: s.label }))} />
            <div style={{ gridColumn: 'span 2' }}><Field label='Notes' value={form.notes || ''} onChange={ff('notes')} type='textarea' placeholder='Any notes about this client…' /></div>
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
