import { useState, useEffect } from 'react'
import { Users, CreditCard, Calendar, UserPlus, Settings, LogOut, CheckSquare, Briefcase } from 'lucide-react'
import { B, FONT_DISPLAY, FONT_BODY } from './brand'
import Login        from './views/Login'
import TodayView    from './views/TodayView'
import LeadsView    from './views/LeadsView'
import PaymentsView from './views/PaymentsView'
import EventsView   from './views/EventsView'
import RepFormView  from './views/RepFormView'
import ClientsView  from './views/ClientsView'
import SettingsView from './views/SettingsView'
import { fetchLeads, fetchPayments, fetchEvents, fetchReps, fetchTasks, fetchClients, getSetting } from './lib/db'

const todayStr = () => new Date().toISOString().split('T')[0]

const NAV = [
  { key: 'today',    Icon: CheckSquare, label: 'TODAY',    adminOnly: true  },
  { key: 'leads',    Icon: Users,       label: 'LEADS',    adminOnly: false },
  { key: 'clients',  Icon: Briefcase,   label: 'CLIENTS',  adminOnly: true  },
  { key: 'payments', Icon: CreditCard,  label: 'PAYMENTS', adminOnly: true  },
  { key: 'events',   Icon: Calendar,    label: 'EVENTS',   adminOnly: false },
  { key: 'repform',  Icon: UserPlus,    label: 'REP FORM', adminOnly: false },
  { key: 'settings', Icon: Settings,    label: 'SETTINGS', adminOnly: true  },
]

function useMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return mobile
}

export default function App() {
  const [role,     setRole]     = useState(null)
  const [view,     setView]     = useState('today')
  const [leads,    setLeads]    = useState([])
  const [payments, setPayments] = useState([])
  const [events,   setEvents]   = useState([])
  const [reps,     setReps]     = useState([])
  const [tasks,    setTasks]    = useState([])
  const [clients,  setClients]  = useState([])
  const [adminPin, setAdminPin] = useState('fins')
  const [repCode,  setRepCode]  = useState('reps')
  const [loading,  setLoading]  = useState(true)
  const isMobile = useMobile()

  useEffect(() => {
    Promise.all([
      fetchLeads(), fetchPayments(), fetchEvents(), fetchReps(),
      fetchTasks(), fetchClients(),
      getSetting('admin_pin'), getSetting('rep_code'),
    ]).then(([l, p, e, r, t, c, ap, rc]) => {
      setLeads(l || []); setPayments(p || []); setEvents(e || []); setReps(r || [])
      setTasks(t || []); setClients(c || [])
      if (ap) setAdminPin(ap)
      if (rc) setRepCode(rc)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  const overdueCt = leads.filter(l => l.followUpDate && l.followUpDate < todayStr() && l.status !== 'won' && l.status !== 'lost').length
  const incompleteTasks = tasks.filter(t => t.date === todayStr() && !t.done).length
  const navItems = NAV.filter(n => role === 'admin' || !n.adminOnly)

  const handleLogin = r => { setRole(r); setView(r === 'admin' ? 'today' : 'leads') }

  if (loading) return (
    <div style={{ background: B.ink, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY }}>
      <div style={{ color: B.mid, fontSize: 12, letterSpacing: '0.1em' }}>LOADING</div>
    </div>
  )

  if (!role) return <Login onLogin={handleLogin} adminPin={adminPin} repCode={repCode} isMobile={isMobile} />

  const TITLE = { today:'TODAY', leads:'LEADS', clients:'CLIENTS', payments:'PAYMENTS', events:'EVENTS', repform:'REP FORM', settings:'SETTINGS' }

  const mainContent = (
    <main style={{ flex: 1, padding: isMobile ? '20px 16px 80px' : '30px 36px', overflowY: 'auto', minWidth: 0 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 28 : 36, letterSpacing: '0.08em', color: B.bone, marginBottom: isMobile ? 16 : 24, lineHeight: 1 }}>
        {TITLE[view]}
      </div>
      {view === 'today'    && <TodayView    tasks={tasks}       setTasks={setTasks}       leads={leads} payments={payments} clients={clients} isMobile={isMobile} />}
      {view === 'leads'    && <LeadsView    leads={leads}       setLeads={setLeads}       role={role} reps={reps} isMobile={isMobile} />}
      {view === 'clients'  && <ClientsView  clients={clients}   setClients={setClients}   isMobile={isMobile} />}
      {view === 'payments' && <PaymentsView payments={payments} setPayments={setPayments} isMobile={isMobile} />}
      {view === 'events'   && <EventsView   events={events}     setEvents={setEvents}     reps={reps} role={role} isMobile={isMobile} />}
      {view === 'repform'  && <RepFormView  setLeads={setLeads} isMobile={isMobile} />}
      {view === 'settings' && <SettingsView reps={reps} setReps={setReps} adminPin={adminPin} repCode={repCode} setAdminPin={setAdminPin} setRepCode={setRepCode} isMobile={isMobile} />}
    </main>
  )

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: B.ink, fontFamily: FONT_BODY, color: B.bone }}>
        {/* Mobile top bar */}
        <div style={{ background: B.surface, borderBottom: `1px solid ${B.border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, letterSpacing: '0.14em', color: B.bone }}>FINS</div>
          <span style={{ color: B.mid, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{role === 'admin' ? 'ADMIN' : 'REP'}</span>
        </div>

        {mainContent}

        {/* Mobile bottom nav */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: B.surface, borderTop: `1px solid ${B.border}`, display: 'flex', zIndex: 100 }}>
          {navItems.map(({ key, Icon, label }) => {
            const active = view === key
            const badge = key === 'leads' ? overdueCt : key === 'today' ? incompleteTasks : null
            return (
              <button key={key} onClick={() => setView(key)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '10px 4px 12px', background: 'none', border: 'none', cursor: 'pointer',
                color: active ? B.bone : B.mid, position: 'relative',
              }}>
                <Icon size={18} />
                <span style={{ fontSize: 9, fontFamily: FONT_BODY, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>{label}</span>
                {badge > 0 && (
                  <div style={{ position: 'absolute', top: 6, right: '50%', marginRight: -16, background: '#FCA5A5', color: B.ink, borderRadius: 8, fontSize: 8, fontWeight: 800, padding: '1px 4px', fontFamily: FONT_BODY }}>{badge}</div>
                )}
              </button>
            )
          })}
          <button onClick={() => { setRole(null); setView('today') }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px 12px', background: 'none', border: 'none', cursor: 'pointer', color: B.mid }}>
            <LogOut size={18} />
            <span style={{ fontSize: 9, fontFamily: FONT_BODY, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>OUT</span>
          </button>
        </div>
      </div>
    )
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: B.ink, fontFamily: FONT_BODY, color: B.bone }}>
      <aside style={{ width: 196, background: B.surface, borderRight: `1px solid ${B.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '24px 20px 18px', borderBottom: `1px solid ${B.border}` }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, letterSpacing: '0.14em', color: B.bone, lineHeight: 1 }}>FINS</div>
          <div style={{ color: B.mid, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 3 }}>CREATIVE &amp; MARKETING</div>
        </div>
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${B.border}` }}>
          <span style={{ color: B.mid, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{role === 'admin' ? 'ADMIN ACCESS' : 'REP ACCESS'}</span>
        </div>
        <nav style={{ padding: '8px 10px', flex: 1 }}>
          {navItems.map(({ key, Icon, label }) => {
            const active = view === key
            const badge = key === 'leads' ? overdueCt : key === 'today' ? incompleteTasks : null
            return (
              <button key={key} onClick={() => setView(key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 11px', borderRadius: 3, border: 'none', cursor: 'pointer',
                background: active ? 'rgba(245,242,237,0.06)' : 'transparent',
                color: active ? B.bone : B.mid, fontFamily: FONT_DISPLAY, fontSize: 15, letterSpacing: '0.1em',
                marginBottom: 2, textAlign: 'left', transition: 'background 0.1s, color 0.1s',
              }}>
                <Icon size={13} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge > 0 && <span style={{ background: 'rgba(252,165,165,0.15)', color: '#FCA5A5', borderRadius: 2, fontSize: 9, fontWeight: 800, padding: '1px 5px', fontFamily: FONT_BODY }}>{badge}</span>}
              </button>
            )
          })}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${B.border}` }}>
          <button onClick={() => { setRole(null); setView('today') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 3, border: 'none', background: 'transparent', color: B.mid, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </aside>
      {mainContent}
    </div>
  )
}
