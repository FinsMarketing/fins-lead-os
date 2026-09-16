import { useState } from 'react'
import { Plus, ChevronRight, User } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY, SERVICES } from '../brand'
import { Badge, Btn, Field, Modal, Stat } from '../components/Shared'
import { upsertClient } from '../lib/db'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const fmtAUD = n => `$${Number(n || 0).toLocaleString('en-AU')}`
const EMPTY = { name:'', contactName:'', email:'', phone:'', service:'', monthlyValue:'', startDate:'', notes:'', status:'active' }
const STATUS = [{ key:'active', label:'Active' }, { key:'paused', label:'Paused' }, { key:'churned', label:'Churned' }]

export default function ClientsView({ clients, setClients, isMobile, role = 'admin', onOpenClient }) {
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState({})
  const [saving, setSaving] = useState(false)
  const ff = k => v => setForm(p => ({ ...p, [k]: v }))
  const isAdmin = role === 'admin'

  const mrr = clients.filter(c => c.status === 'active').reduce((a, c) => a + Number(c.monthlyValue || 0), 0)
  const active = clients.filter(c => c.status === 'active').length

  const save = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      const toSave = { ...form, id: uid(), createdAt: new Date().toISOString() }
      const saved = await upsertClient(toSave)
      setClients(prev => [saved, ...prev])
      setModal(null)
      // Auto-open the new client's profile
      if (isAdmin && onOpenClient) onOpenClient(saved)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const sc = k => STATUS.find(s => s.key === k) || STATUS[0]

  return (
    <div>
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          <Stat label='Active Clients' value={active} />
          <Stat label='Monthly Revenue' value={fmtAUD(mrr)} />
          <Stat label='Annual Run Rate' value={fmtAUD(mrr * 12)} />
        </div>
      )}

      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Btn onClick={() => { setForm({ ...EMPTY }); setModal('add') }}><Plus size={13} /> ADD CLIENT</Btn>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {clients.length === 0 && (
          <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: '30px 0', textAlign: 'center', color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>No clients yet</div>
        )}
        {clients.map(c => (
          <button key={c.id} onClick={() => isAdmin && onOpenClient && onOpenClient(c)} style={{
            background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4,
            padding: '14px 16px', cursor: isAdmin ? 'pointer' : 'default',
            textAlign: 'left', fontFamily: FONT_BODY,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            {c.profilePic ? (
              <img src={c.profilePic} alt='' style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: B.card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={18} style={{ color: B.mid }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: B.bone, fontSize: 15, fontWeight: 700 }}>{c.name}</div>
              <div style={{ color: B.mid, fontSize: 12, marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {c.service && <span>{c.service}</span>}
                {isAdmin && c.monthlyValue && <span>{fmtAUD(c.monthlyValue)}/mo</span>}
                {c.startDate && <span>Since {c.startDate}</span>}
              </div>
            </div>
            <Badge label={sc(c.status).label} statusKey={c.status} type='client' />
            {isAdmin && <ChevronRight size={14} style={{ color: B.mid }} />}
          </button>
        ))}
      </div>

      {modal && isAdmin && (
        <Modal title='New Client' onClose={() => setModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 12px' }}>
            <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}><Field label='Company Name' value={form.name || ''} onChange={ff('name')} required placeholder='Maxim Education' /></div>
            <Field label='Contact Name'   value={form.contactName || ''} onChange={ff('contactName')} />
            <Field label='Email'          value={form.email || ''}       onChange={ff('email')}       />
            <Field label='Phone'          value={form.phone || ''}       onChange={ff('phone')}       />
            <Field label='Service'        value={form.service || ''}     onChange={ff('service')}     options={SERVICES} />
            <Field label='Monthly Value (AUD)' value={form.monthlyValue || ''} onChange={ff('monthlyValue')} type='number' />
            <Field label='Start Date'     value={form.startDate || ''}   onChange={ff('startDate')}   type='date' />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Btn variant='ghost' onClick={() => setModal(null)}>CANCEL</Btn>
            <Btn onClick={save} disabled={!form.name || saving}>{saving ? 'SAVING…' : 'CREATE & OPEN'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
