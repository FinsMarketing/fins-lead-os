import { useState } from 'react'
import { Plus, Edit2, Trash2, DollarSign } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY } from '../brand'
import { Btn, Field, Modal, Stat } from '../components/Shared'
import { upsertBoardTask, deleteBoardTask } from '../lib/db'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const fmtAUD = n => `$${Number(n || 0).toLocaleString('en-AU')}`

const COLUMNS = [
  { key: 'assigned',    label: 'ASSIGNED',    col: '#888580' },
  { key: 'in_progress', label: 'IN PROGRESS', col: '#93C5FD' },
  { key: 'in_review',   label: 'IN REVIEW',   col: '#FDE68A' },
  { key: 'completed',   label: 'COMPLETED',   col: '#6EE7B7' },
]

const CARD_COLORS = ['#F5F2ED', '#FCA5A5', '#FDE68A', '#6EE7B7', '#93C5FD', '#C4B5FD', '#F9A8D4']

// Two modes: 'admin' shows all staff & clients, 'staff' shows only current member's tasks
export default function StaffBoardView({ tasks, setTasks, clients, team, isMobile, mode = 'admin', currentMember = null }) {
  const [modal, setModal]   = useState(null)
  const [form, setForm]     = useState({})
  const [saving, setSaving] = useState(false)
  const ff = k => v => setForm(p => ({ ...p, [k]: v }))

  // Filter tasks based on mode
  const visibleTasks = mode === 'staff' && currentMember
    ? tasks.filter(t => t.assignedTo === currentMember.name)
    : tasks

  const save = async () => {
    if (!form.title) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const isNew = modal === 'add'
      const task = isNew ? { ...form, id: uid() } : form
      // Auto-timestamp on completion
      if (form.status === 'completed' && !form.completedAt) task.completedAt = now
      const savedT = await upsertBoardTask(task)
      setTasks(prev => isNew ? [savedT, ...prev] : prev.map(t => t.id === savedT.id ? savedT : t))
      setModal(null)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete this task?')) return
    try { await deleteBoardTask(id); setTasks(prev => prev.filter(t => t.id !== id)) }
    catch (e) { console.error(e) }
  }

  const moveTask = async (task, newStatus) => {
    const now = new Date().toISOString()
    const updated = { ...task, status: newStatus }
    if (newStatus === 'completed' && !task.completedAt) updated.completedAt = now
    try {
      await upsertBoardTask(updated)
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
    } catch (e) { console.error(e) }
  }

  const togglePaid = async (task) => {
    const now = new Date().toISOString()
    const updated = { ...task, paid: !task.paid, paidAt: !task.paid ? now : null }
    try {
      await upsertBoardTask(updated)
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
    } catch (e) { console.error(e) }
  }

  // Earnings summary for staff mode
  const now = new Date()
  const thisMonth = now.toISOString().slice(0, 7)
  const totalOwed    = visibleTasks.filter(t => t.status === 'completed' && !t.paid).reduce((s, t) => s + Number(t.price || 0), 0)
  const totalPaid    = visibleTasks.filter(t => t.paid).reduce((s, t) => s + Number(t.price || 0), 0)
  const thisMonthPaid = visibleTasks.filter(t => t.paid && t.paidAt?.startsWith(thisMonth)).reduce((s, t) => s + Number(t.price || 0), 0)

  const clientNames = clients.map(c => c.name)

  return (
    <div>
      {/* Stats — only in staff mode or admin overview */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        <Stat label='Owed to you' value={fmtAUD(totalOwed)} />
        <Stat label='Paid this month' value={fmtAUD(thisMonthPaid)} />
        <Stat label='Total earned' value={fmtAUD(totalPaid)} />
      </div>

      {mode === 'admin' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Btn onClick={() => { setForm({ title: '', description: '', status: 'assigned', assignedTo: '', clientName: '', color: '', price: 0 }); setModal('add') }}>
            <Plus size={13} /> ADD TASK
          </Btn>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        {COLUMNS.map(col => {
          const colTasks = visibleTasks.filter(t => t.status === col.key)
          return (
            <div key={col.key} style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 12, minHeight: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${B.border}` }}>
                <span style={{ color: col.col, fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>{col.label}</span>
                <span style={{ color: B.mid, fontSize: 10, fontFamily: FONT_BODY }}>{colTasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {colTasks.map(task => (
                  <div key={task.id} style={{ background: B.card, border: `1px solid ${task.color || B.border}`, borderLeft: `3px solid ${task.color || B.mid}`, borderRadius: 4, padding: 10 }}>
                    <div style={{ color: B.bone, fontSize: 13, fontFamily: FONT_BODY, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{task.title}</div>
                    {task.description && <div style={{ color: B.mid, fontSize: 11, fontFamily: FONT_BODY, marginBottom: 6, lineHeight: 1.4 }}>{task.description}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6, fontSize: 10, color: B.mid, fontFamily: FONT_BODY }}>
                      {task.clientName && <span>🏢 {task.clientName}</span>}
                      {task.assignedTo && mode === 'admin' && <span>👤 {task.assignedTo}</span>}
                      {task.price > 0 && <span style={{ color: task.paid ? '#6EE7B7' : '#FDE68A', fontWeight: 700 }}>{fmtAUD(task.price)}</span>}
                      {task.paid && <span style={{ color: '#6EE7B7' }}>PAID</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                      {COLUMNS.filter(c => c.key !== task.status).map(c => (
                        <button key={c.key} onClick={() => moveTask(task, c.key)} style={{ background: 'transparent', border: `1px solid ${B.border}`, borderRadius: 3, padding: '2px 6px', color: B.mid, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: FONT_BODY }}>
                          → {c.label}
                        </button>
                      ))}
                      {mode === 'admin' && task.status === 'completed' && (
                        <button onClick={() => togglePaid(task)} style={{ background: task.paid ? 'rgba(110,231,183,0.15)' : 'transparent', border: `1px solid ${task.paid ? '#6EE7B7' : B.border}`, borderRadius: 3, padding: '2px 6px', color: task.paid ? '#6EE7B7' : B.mid, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <DollarSign size={9} /> {task.paid ? 'PAID' : 'MARK PAID'}
                        </button>
                      )}
                      {mode === 'admin' && (
                        <>
                          <button onClick={() => { setForm(task); setModal('edit') }} style={{ background: 'transparent', border: `1px solid ${B.border}`, borderRadius: 3, padding: '2px 6px', color: B.mid, cursor: 'pointer', display: 'flex' }}>
                            <Edit2 size={10} />
                          </button>
                          <button onClick={() => del(task.id)} style={{ background: 'transparent', border: `1px solid ${B.border}`, borderRadius: 3, padding: '2px 6px', color: B.mid, cursor: 'pointer', display: 'flex' }}>
                            <Trash2 size={10} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {modal && mode === 'admin' && (
        <Modal title={modal === 'add' ? 'New Task' : 'Edit Task'} onClose={() => setModal(null)}>
          <Field label='Task Title' value={form.title || ''} onChange={ff('title')} required placeholder='Design homepage hero' />
          <Field label='Description' value={form.description || ''} onChange={ff('description')} type='textarea' placeholder='Details…' />
          <Field label='Client' value={form.clientName || ''} onChange={ff('clientName')} options={clientNames.map(n => ({ key: n, label: n }))} />
          <Field label='Assigned to (staff member)' value={form.assignedTo || ''} onChange={ff('assignedTo')} options={team.map(t => ({ key: t.name, label: t.name }))} />
          <Field label='Price paid to staff (AUD)' value={form.price || ''} onChange={ff('price')} type='number' placeholder='150' />
          <Field label='Status' value={form.status || 'assigned'} onChange={ff('status')} options={COLUMNS.map(c => ({ key: c.key, label: c.label }))} />

          <div style={{ marginBottom: 14 }}>
            <label style={{ color: B.mid, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FONT_BODY, display: 'block', marginBottom: 8 }}>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CARD_COLORS.map(c => (
                <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))} style={{ width: 26, height: 26, borderRadius: 4, background: c, cursor: 'pointer', border: form.color === c ? `2px solid ${B.bone}` : `1px solid ${B.border}` }} />
              ))}
              <button onClick={() => setForm(p => ({ ...p, color: '' }))} style={{ width: 26, height: 26, borderRadius: 4, background: 'transparent', cursor: 'pointer', border: !form.color ? `2px solid ${B.bone}` : `1px solid ${B.border}`, color: B.mid, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Btn variant='ghost' onClick={() => setModal(null)}>CANCEL</Btn>
            <Btn onClick={save} disabled={!form.title || saving}>{saving ? 'SAVING…' : 'SAVE'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
