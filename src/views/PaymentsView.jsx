import { useState } from 'react'
import { Plus, Edit2, Trash2, Lock, RefreshCw } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY, PAY_STATUS } from '../brand'
import { Badge, Btn, Field, Modal, Stat } from '../components/Shared'
import { upsertPayment, deletePayment } from '../lib/db'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const fmtAUD = n => `$${Number(n || 0).toLocaleString('en-AU')}`
const EMPTY = { clientName:'', amount:'', status:'pending', dueDate:'', description:'', invoiceNumber:'', isRecurring: false }

function getMonthLabel(dateStr) {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr + '-01').toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}

function getMonthKey(dateStr) {
  if (!dateStr) return 'unknown'
  return dateStr.slice(0, 7) // YYYY-MM
}

export default function PaymentsView({ payments, setPayments }) {
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState({})
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('tracker') // 'tracker' | 'monthly'
  const ff = k => v => setForm(p => ({ ...p, [k]: v }))

  const collected = payments.filter(p => p.status === 'paid').reduce((a, p) => a + Number(p.amount), 0)
  const pending   = payments.filter(p => p.status === 'pending').reduce((a, p) => a + Number(p.amount), 0)
  const overdue   = payments.filter(p => p.status === 'overdue').reduce((a, p) => a + Number(p.amount), 0)
  const recurringMRR = payments.filter(p => p.isRecurring && p.status !== 'churned').reduce((a, p) => a + Number(p.amount), 0)

  const save = async () => {
    if (!form.clientName || !form.amount) return
    setSaving(true)
    try {
      const toSave = modal === 'add' ? { ...form, id: uid(), createdAt: new Date().toISOString() } : { ...form }
      const saved = await upsertPayment(toSave)
      setPayments(prev => modal === 'add' ? [saved, ...prev] : prev.map(p => p.id === saved.id ? saved : p))
      setModal(null)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const del = async id => {
    try { await deletePayment(id); setPayments(prev => prev.filter(p => p.id !== id)) }
    catch (e) { console.error(e) }
  }

  const pc = k => PAY_STATUS.find(s => s.key === k) || PAY_STATUS[0]

  // Monthly breakdown — group paid payments by month
  const paidPayments = payments.filter(p => p.status === 'paid' && p.dueDate)
  const monthMap = {}
  paidPayments.forEach(p => {
    const key = getMonthKey(p.dueDate)
    if (!monthMap[key]) monthMap[key] = { key, label: getMonthLabel(p.dueDate), total: 0, payments: [] }
    monthMap[key].total += Number(p.amount)
    monthMap[key].payments.push(p)
  })
  const months = Object.values(monthMap).sort((a, b) => b.key.localeCompare(a.key))

  // Current month
  const thisMonth = new Date().toISOString().slice(0, 7)
  const thisMonthData = monthMap[thisMonth]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, padding: '9px 14px', background: 'rgba(245,242,237,0.03)', borderRadius: 4, border: `1px solid rgba(245,242,237,0.08)` }}>
        <Lock size={12} style={{ color: B.mid }} />
        <span style={{ color: B.mid, fontSize: 11, fontFamily: FONT_BODY, letterSpacing: '0.05em' }}>Admin only — not visible to reps</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <Stat label='Collected' value={fmtAUD(collected)} />
        <Stat label='Pending'   value={fmtAUD(pending)} />
        <Stat label='Overdue'   value={fmtAUD(overdue)} />
        <Stat label='MRR (Recurring)' value={fmtAUD(recurringMRR)} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[['tracker', 'All Payments'], ['monthly', 'Monthly Breakdown']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: tab === key ? 'rgba(245,242,237,0.08)' : 'transparent',
            border: `1px solid ${tab === key ? 'rgba(245,242,237,0.25)' : B.border}`,
            borderRadius: 4, padding: '7px 14px', cursor: 'pointer',
            color: tab === key ? B.bone : B.mid, fontSize: 12, fontWeight: 700,
            fontFamily: FONT_BODY, letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>{label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <Btn onClick={() => { setForm({ ...EMPTY }); setModal('add') }}><Plus size={13} /> ADD PAYMENT</Btn>
      </div>

      {tab === 'tracker' && (
        <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${B.border}` }}>
                {['Client', 'Invoice', 'Amount', 'Status', 'Due', 'Type', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: B.mid, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT_BODY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && <tr><td colSpan={7} style={{ padding: '36px 0', textAlign: 'center', color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>No payments tracked</td></tr>}
              {payments.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${B.border}` }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontWeight: 700, color: B.bone, fontSize: 14, fontFamily: FONT_BODY }}>{p.clientName}</div>
                    {p.description && <div style={{ color: B.mid, fontSize: 12 }}>{p.description}</div>}
                  </td>
                  <td style={{ padding: '13px 16px', color: B.mid, fontSize: 12, fontFamily: 'monospace' }}>{p.invoiceNumber || '—'}</td>
                  <td style={{ padding: '13px 16px', color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: '0.04em' }}>{fmtAUD(p.amount)}</td>
                  <td style={{ padding: '13px 16px' }}><Badge label={pc(p.status).label} statusKey={p.status} type='pay' /></td>
                  <td style={{ padding: '13px 16px', color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>{p.dueDate || '—'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    {p.isRecurring && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <RefreshCw size={10} style={{ color: B.mid }} />
                        <span style={{ color: B.mid, fontSize: 10, fontFamily: FONT_BODY, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn variant='ghost' size='sm' onClick={() => { setForm({ ...p }); setModal('edit') }}><Edit2 size={11} /></Btn>
                      <Btn variant='danger' size='sm' onClick={() => del(p.id)}><Trash2 size={11} /></Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'monthly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {months.length === 0 && (
            <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: '36px 0', textAlign: 'center', color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>
              No paid payments with due dates yet
            </div>
          )}
          {months.map(m => (
            <div key={m.key} style={{ background: B.surface, border: `1px solid ${m.key === thisMonth ? 'rgba(245,242,237,0.25)' : B.border}`, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${B.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 18, letterSpacing: '0.06em' }}>{m.label.toUpperCase()}</span>
                  {m.key === thisMonth && <span style={{ background: 'rgba(245,242,237,0.1)', color: B.mid, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FONT_BODY, padding: '2px 8px', borderRadius: 3 }}>THIS MONTH</span>}
                </div>
                <span style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 24, letterSpacing: '0.04em' }}>{fmtAUD(m.total)}</span>
              </div>
              <div style={{ padding: '0 18px' }}>
                {m.payments.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${B.border}` }}>
                    <div>
                      <span style={{ color: B.bone, fontSize: 13, fontFamily: FONT_BODY, fontWeight: 600 }}>{p.clientName}</span>
                      {p.description && <span style={{ color: B.mid, fontSize: 12, fontFamily: FONT_BODY, marginLeft: 8 }}>{p.description}</span>}
                    </div>
                    <span style={{ color: B.mid, fontFamily: FONT_BODY, fontSize: 13 }}>{fmtAUD(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'New Payment' : 'Edit Payment'} onClose={() => setModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div style={{ gridColumn: 'span 2' }}><Field label='Client Name' value={form.clientName || ''} onChange={ff('clientName')} required placeholder='Maxim Education' /></div>
            <Field label='Amount (AUD)'  value={form.amount || ''}        onChange={ff('amount')}        type='number' placeholder='5000' />
            <Field label='Invoice #'     value={form.invoiceNumber || ''} onChange={ff('invoiceNumber')} placeholder='INV-001' />
            <Field label='Status'        value={form.status || 'pending'} onChange={ff('status')}        options={PAY_STATUS.map(s => ({ key: s.key, label: s.label }))} />
            <Field label='Due Date'      value={form.dueDate || ''}       onChange={ff('dueDate')}       type='date' />
            <div style={{ gridColumn: 'span 2' }}><Field label='Description' value={form.description || ''} onChange={ff('description')} type='textarea' placeholder='Retainer – June, campaign build…' /></div>
            {/* Recurring toggle */}
            <div style={{ gridColumn: 'span 2', marginBottom: 14 }}>
              <button onClick={() => setForm(p => ({ ...p, isRecurring: !p.isRecurring }))} style={{
                display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0
              }}>
                <div style={{ width: 36, height: 20, borderRadius: 10, background: form.isRecurring ? B.bone : B.border, position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 7, background: form.isRecurring ? B.ink : B.mid, position: 'absolute', top: 3, left: form.isRecurring ? 19 : 3, transition: 'left 0.2s' }} />
                </div>
                <span style={{ color: B.mid, fontSize: 12, fontFamily: FONT_BODY, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Monthly recurring</span>
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Btn variant='ghost' onClick={() => setModal(null)}>CANCEL</Btn>
            <Btn onClick={save} disabled={!form.clientName || !form.amount || saving}>{saving ? 'SAVING…' : 'SAVE'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
