import { useState } from 'react'
import { ChevronRight, CheckCircle } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY, SERVICES } from '../brand'
import { Btn, Field } from '../components/Shared'
import { upsertLead } from '../lib/db'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const EMPTY = { name:'', company:'', email:'', phone:'', service:'', source:'', notes:'' }

export default function RepFormView({ setLeads }) {
  const [form,    setForm]    = useState({ ...EMPTY })
  const [done,    setDone]    = useState(false)
  const [saving,  setSaving]  = useState(false)
  const ff = k => v => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.name || !form.email) return
    setSaving(true)
    try {
      const saved = await upsertLead({ ...form, id: uid(), status: 'new', followUpDate: '' })
      setLeads(prev => [saved, ...prev])
      setDone(true)
      setTimeout(() => { setForm({ ...EMPTY }); setDone(false) }, 3000)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ borderBottom: `1px solid ${B.border}`, padding: '26px 28px' }}>
          <div style={{ color: B.mid, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FONT_BODY, marginBottom: 8 }}>FINS MARKETING CO</div>
          <div style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 36, letterSpacing: '0.08em', lineHeight: 1 }}>NEW LEAD</div>
          <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY, marginTop: 6, lineHeight: 1.4 }}>Submit your prospect's details — they'll land in the pipeline immediately.</div>
        </div>
        <div style={{ padding: 28 }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <CheckCircle size={40} style={{ color: B.mid, margin: '0 auto 12px', display: 'block' }} />
              <div style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 28, letterSpacing: '0.08em' }}>LEAD SUBMITTED</div>
              <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY, marginTop: 6 }}>Now in the pipeline</div>
            </div>
          ) : (
            <>
              <Field label='Full Name'                value={form.name}    onChange={ff('name')}    required placeholder='Alex Johnson' />
              <Field label='Company'                  value={form.company} onChange={ff('company')} placeholder='Johnson Group' />
              <Field label='Email'                    value={form.email}   onChange={ff('email')}   required placeholder='alex@company.com' />
              <Field label='Phone'                    value={form.phone}   onChange={ff('phone')}   placeholder='+61 400 000 000' />
              <Field label='Service Interest'         value={form.service} onChange={ff('service')} options={SERVICES} />
              <Field label='Where did you find them?' value={form.source}  onChange={ff('source')}  placeholder='Event, LinkedIn, cold call…' />
              <Field label='Notes'                    value={form.notes}   onChange={ff('notes')}   type='textarea' placeholder='Anything useful about this lead…' />
              <Btn onClick={submit} disabled={!form.name || !form.email || saving} full>
                {saving ? 'SUBMITTING…' : <>SUBMIT LEAD <ChevronRight size={13} /></>}
              </Btn>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
