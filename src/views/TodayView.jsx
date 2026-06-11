import { useState, useEffect } from 'react'
import { Plus, Check, RotateCcw, ChevronDown, ChevronUp, AlertTriangle, Clock, DollarSign, Trash2 } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY } from '../brand'
import { Btn } from '../components/Shared'
import { saveTasks } from '../lib/db'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const todayStr = () => new Date().toISOString().split('T')[0]
const yesterdayStr = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] }
const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
const fmtAUD = n => `$${Number(n || 0).toLocaleString('en-AU')}`

export default function TodayView({ tasks, setTasks, leads, payments, clients }) {
  const [newText,   setNewText]   = useState('')
  const [newClient, setNewClient] = useState('')
  const [showYest,  setShowYest]  = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const today     = todayStr()
  const yesterday = yesterdayStr()

  // On mount — carry over incomplete tasks from yesterday
  useEffect(() => {
    const yesterdayIncomplete = tasks.filter(t => t.date === yesterday && !t.done)
    const alreadyCarried = tasks.filter(t => t.date === today && t.carriedOver)
    if (yesterdayIncomplete.length > 0 && alreadyCarried.length === 0) {
      const carried = yesterdayIncomplete.map(t => ({ ...t, id: uid(), date: today, carriedOver: true, done: false }))
      const updated = [...tasks, ...carried]
      setTasks(updated); saveTasks(updated)
    }
  }, [])

  const todayTasks     = tasks.filter(t => t.date === today)
  const yesterdayTasks = tasks.filter(t => t.date === yesterday)

  const addTask = () => {
    if (!newText.trim()) return
    const task = { id: uid(), text: newText.trim(), clientName: newClient, done: false, date: today, carriedOver: false, createdAt: new Date().toISOString() }
    const updated = [...tasks, task]
    setTasks(updated); saveTasks(updated)
    setNewText(''); setNewClient('')
  }

  const toggle = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTasks(updated); saveTasks(updated)
  }

  const removeTask = (id) => {
    const updated = tasks.filter(t => t.id !== id)
    setTasks(updated); saveTasks(updated)
  }

  const resetToday = () => {
    const updated = tasks.filter(t => t.date !== today)
    setTasks(updated); saveTasks(updated)
    setConfirmReset(false)
  }

  // Smart recommendations
  const overdue = leads.filter(l => l.followUpDate && l.followUpDate < today && l.status !== 'won' && l.status !== 'lost')
  const dueToday = leads.filter(l => l.followUpDate === today && l.status !== 'won' && l.status !== 'lost')
  const overduePayments = payments.filter(p => p.status === 'overdue')
  const pendingPayments = payments.filter(p => p.status === 'pending' && p.dueDate && p.dueDate <= today)

  // Group today tasks by client
  const grouped = todayTasks.reduce((acc, t) => {
    const key = t.clientName || 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  const inp = { background: B.card, border: `1px solid ${B.border}`, borderRadius: 4, padding: '8px 12px', color: B.bone, fontSize: 13, fontFamily: FONT_BODY, outline: 'none' }

  const TaskItem = ({ task, showDate }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${B.border}` }}>
      <button onClick={() => toggle(task.id)} style={{
        width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${task.done ? B.bone : B.mid}`,
        background: task.done ? B.bone : 'transparent', cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {task.done && <Check size={11} style={{ color: B.ink }} />}
      </button>
      <div style={{ flex: 1 }}>
        <span style={{ color: task.done ? B.mid : B.bone, fontSize: 14, fontFamily: FONT_BODY, textDecoration: task.done ? 'line-through' : 'none' }}>
          {task.text}
        </span>
        {task.carriedOver && <span style={{ marginLeft: 8, color: B.mid, fontSize: 10, fontFamily: FONT_BODY, letterSpacing: '0.06em', textTransform: 'uppercase' }}>carried over</span>}
      </div>
      <button onClick={() => removeTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: B.mid, display: 'flex', padding: 2 }}>
        <Trash2 size={11} />
      </button>
    </div>
  )

  const done = todayTasks.filter(t => t.done).length
  const total = todayTasks.length

  return (
    <div style={{ maxWidth: 700 }}>

      {/* Date + progress */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: B.mid, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FONT_BODY, marginBottom: 4 }}>{fmtDate(today)}</div>
        {total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{ flex: 1, height: 3, background: B.border, borderRadius: 2 }}>
              <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: B.bone, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <span style={{ color: B.mid, fontSize: 11, fontFamily: FONT_BODY }}>{done}/{total}</span>
          </div>
        )}
      </div>

      {/* Alerts */}
      {(overdue.length > 0 || overduePayments.length > 0 || dueToday.length > 0 || pendingPayments.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {overdue.length > 0 && (
            <div style={{ background: 'rgba(252,165,165,0.07)', border: '1px solid rgba(252,165,165,0.2)', borderRadius: 4, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={13} style={{ color: '#FCA5A5', flexShrink: 0 }} />
              <span style={{ color: '#FCA5A5', fontSize: 12, fontFamily: FONT_BODY }}><strong>{overdue.length} overdue lead{overdue.length > 1 ? 's' : ''}</strong> to chase — {overdue.slice(0, 3).map(l => l.name).join(', ')}{overdue.length > 3 ? ` +${overdue.length - 3} more` : ''}</span>
            </div>
          )}
          {dueToday.length > 0 && (
            <div style={{ background: 'rgba(253,230,138,0.07)', border: '1px solid rgba(253,230,138,0.2)', borderRadius: 4, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={13} style={{ color: '#FDE68A', flexShrink: 0 }} />
              <span style={{ color: '#FDE68A', fontSize: 12, fontFamily: FONT_BODY }}><strong>{dueToday.length} lead{dueToday.length > 1 ? 's' : ''} due today</strong> — {dueToday.slice(0, 3).map(l => l.name).join(', ')}</span>
            </div>
          )}
          {(overduePayments.length > 0 || pendingPayments.length > 0) && (
            <div style={{ background: 'rgba(110,231,183,0.07)', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 4, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <DollarSign size={13} style={{ color: '#6EE7B7', flexShrink: 0 }} />
              <span style={{ color: '#6EE7B7', fontSize: 12, fontFamily: FONT_BODY }}>
                {overduePayments.length > 0 && <><strong>{fmtAUD(overduePayments.reduce((a, p) => a + Number(p.amount), 0))} overdue</strong>{pendingPayments.length > 0 ? ' · ' : ''}</>}
                {pendingPayments.length > 0 && <><strong>{fmtAUD(pendingPayments.reduce((a, p) => a + Number(p.amount), 0))} due today</strong></>}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Add task */}
      <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder='Add a task…' style={{ ...inp, flex: 2, minWidth: 160 }} />
          <select value={newClient} onChange={e => setNewClient(e.target.value)} style={{ ...inp, flex: 1, minWidth: 120, cursor: 'pointer' }}>
            <option value=''>No client</option>
            {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            <option value='General'>General</option>
          </select>
          <Btn onClick={addTask} disabled={!newText.trim()}><Plus size={13} /> ADD</Btn>
        </div>
      </div>

      {/* Today's tasks */}
      <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${B.border}` }}>
          <span style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 18, letterSpacing: '0.08em' }}>TODAY</span>
          {total > 0 && (
            confirmReset ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: B.mid, fontSize: 11, fontFamily: FONT_BODY }}>Reset all tasks?</span>
                <Btn variant='danger' size='sm' onClick={resetToday}>YES, RESET</Btn>
                <Btn variant='ghost' size='sm' onClick={() => setConfirmReset(false)}>CANCEL</Btn>
              </div>
            ) : (
              <Btn variant='ghost' size='sm' onClick={() => setConfirmReset(true)}><RotateCcw size={11} /> RESET</Btn>
            )
          )}
        </div>

        {todayTasks.length === 0 ? (
          <div style={{ padding: '28px 0', textAlign: 'center', color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>No tasks yet — add one above</div>
        ) : (
          <div style={{ padding: '0 18px' }}>
            {Object.entries(grouped).map(([client, clientTasks]) => (
              <div key={client} style={{ paddingTop: 12, paddingBottom: 4 }}>
                <div style={{ color: B.mid, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FONT_BODY, marginBottom: 4 }}>{client}</div>
                {clientTasks.map(t => <TaskItem key={t.id} task={t} />)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yesterday */}
      {yesterdayTasks.length > 0 && (
        <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, overflow: 'hidden' }}>
          <button onClick={() => setShowYest(s => !s)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
          }}>
            <span style={{ color: B.mid, fontFamily: FONT_DISPLAY, fontSize: 16, letterSpacing: '0.08em' }}>
              YESTERDAY — {yesterdayTasks.filter(t => t.done).length}/{yesterdayTasks.length} done
            </span>
            {showYest ? <ChevronUp size={14} style={{ color: B.mid }} /> : <ChevronDown size={14} style={{ color: B.mid }} />}
          </button>
          {showYest && (
            <div style={{ padding: '0 18px 12px' }}>
              {yesterdayTasks.map(t => <TaskItem key={t.id} task={t} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
