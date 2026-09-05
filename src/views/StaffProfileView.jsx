import { B, FONT_BODY, FONT_DISPLAY } from '../brand'
import { Stat } from '../components/Shared'
import { User } from 'lucide-react'

const fmtAUD = n => `$${Number(n || 0).toLocaleString('en-AU')}`
const ROLES = { sales: 'Sales', marketing: 'Marketing', delivery: 'Delivery' }

export default function StaffProfileView({ member, tasks, isMobile }) {
  const myTasks = tasks.filter(t => t.assignedTo === member.name)
  const now = new Date()
  const thisMonth = now.toISOString().slice(0, 7)

  const owed        = myTasks.filter(t => t.status === 'completed' && !t.paid).reduce((s, t) => s + Number(t.price || 0), 0)
  const totalPaid   = myTasks.filter(t => t.paid).reduce((s, t) => s + Number(t.price || 0), 0)
  const paidThisMon = myTasks.filter(t => t.paid && t.paidAt?.startsWith(thisMonth)).reduce((s, t) => s + Number(t.price || 0), 0)
  const completedCt = myTasks.filter(t => t.status === 'completed').length
  const activeCt    = myTasks.filter(t => t.status !== 'completed').length

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 24, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {member.profilePic ? (
          <img src={member.profilePic} alt='' style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: B.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={30} style={{ color: B.mid }} />
          </div>
        )}
        <div>
          <div style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 30, letterSpacing: '0.06em', lineHeight: 1 }}>{member.name.toUpperCase()}</div>
          <div style={{ color: B.mid, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6, fontFamily: FONT_BODY }}>{ROLES[member.role] || member.role} · {member.email}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <Stat label='Owed to you'      value={fmtAUD(owed)} />
        <Stat label='Paid this month'  value={fmtAUD(paidThisMon)} />
        <Stat label='Total earned'     value={fmtAUD(totalPaid)} />
        <Stat label='Active tasks'     value={activeCt} />
        <Stat label='Completed tasks'  value={completedCt} />
      </div>

      <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 20 }}>
        <div style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 18, letterSpacing: '0.08em', marginBottom: 12 }}>PAYMENT HISTORY</div>
        {myTasks.filter(t => t.paid).length === 0 ? (
          <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY, padding: '20px 0', textAlign: 'center' }}>No payments yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${B.border}` }}>
                {['Task', 'Client', 'Amount', 'Paid on'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: B.mid, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT_BODY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myTasks.filter(t => t.paid).sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || '')).map(t => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${B.border}` }}>
                  <td style={{ padding: '10px 12px', color: B.bone, fontSize: 13, fontFamily: FONT_BODY }}>{t.title}</td>
                  <td style={{ padding: '10px 12px', color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>{t.clientName || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#6EE7B7', fontFamily: FONT_DISPLAY, fontSize: 16, letterSpacing: '0.04em' }}>{fmtAUD(t.price)}</td>
                  <td style={{ padding: '10px 12px', color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>{t.paidAt ? new Date(t.paidAt).toLocaleDateString('en-AU') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
