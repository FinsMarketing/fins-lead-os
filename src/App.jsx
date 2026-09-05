import { useState, useEffect } from 'react'
import { Users, CreditCard, Calendar, UserPlus, Settings, LogOut, Briefcase, Columns, User } from 'lucide-react'
import { B, FONT_DISPLAY, FONT_BODY } from './brand'
import Login           from './views/Login'
import LeadsView       from './views/LeadsView'
import PaymentsView    from './views/PaymentsView'
import EventsView      from './views/EventsView'
import RepFormView     from './views/RepFormView'
import ClientsView     from './views/ClientsView'
import StaffBoardView  from './views/StaffBoardView'
import StaffProfileView from './views/StaffProfileView'
import SettingsView    from './views/SettingsView'
import { fetchLeads, fetchPayments, fetchEvents, fetchTeam, fetchClients, fetchBoardTasks, getSetting, cleanupPastEvents } from './lib/db'

const todayStr = () => new Date().toISOString().split('T')[0]

// Admin nav
const ADMIN_NAV = [
  { key: 'leads',    Icon: Users,       label: 'LEADS' },
  { key: 'clients',  Icon: Briefcase,   label: 'CLIENTS' },
  { key: 'board',    Icon: Columns,     label: 'BOARD' },
  { key: 'payments', Icon: CreditCard,  label: 'PAYMENTS' },
  { key: 'events',   Icon: Calendar,    label: 'EVENTS' },
  { key: 'repform',  Icon: UserPlus,    label: 'REP FORM' },
  { key: 'settings', Icon: Settings,    label: 'SETTINGS' },
]

// Team member nav (per-role)
const TEAM_NAV = {
  sales:     [{ key: 'leads', Icon: Users, label: 'LEADS' }, { key: 'events', Icon: Calendar, label: 'EVENTS' }, { key: 'repform', Icon: UserPlus, label: 'REP FORM' }, { key: 'profile', Icon: User, label: 'PROFILE' }],
  marketing: [{ key: 'myboard', Icon: Columns, label: 'MY BOARD' }, { key: 'clients', Icon: Briefcase, label: 'CLIENTS' }, { key: 'events', Icon: Calendar, label: 'EVENTS' }, { key: 'profile', Icon: User, label: 'PROFILE' }],
  delivery:  [{ key: 'myboard', Icon: Columns, label: 'MY BOARD' }, { key: 'events', Icon: Calendar, label: 'EVENTS' }, { key: 'profile', Icon: User, label: 'PROFILE' }],
}

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
  const [role,          setRole]          = useState(null) // 'admin' | 'team'
  const [currentMember, setCurrentMember] = useState(null) // team member object if team login
  const [view,          setView]          = useState('leads')
  const [leads,         setLeads]         = useState([])
  const [payments,      setPayments]      = useState([])
  const [events,        setEvents]        = useState([])
  const [team,          setTeam]          = useState([])
  const [clients,       setClients]       = useState([])
  const [boardTasks,    setBoardTasks]    = useState([])
  const [adminPin,      setAdminPin]      = useState('fins')
  const [loading,       setLoading]       = useState(true)
  const isMobile = useMobile()

  useEffect(() => {
    cleanupPastEvents().catch(console.error)
    Promise.all([
      fetchLeads(), fetchPayments(), fetchEvents(), fetchTeam(),
      fetchClients(), fetchBoardTasks(),
      getSetting('admin_pin'),
    ]).then(([l, p, e, r, c, bt, ap]) => {
      setLeads(l || []); setPayments(p || []); setEvents(e || []); setTeam(r || [])
      setClients(c || []); setBoardTasks(bt || [])
      if (ap) setAdminPin(ap)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  const overdueCt = leads.filter(l => l.followUpDate && l.followUpDate < todayStr() && l.status !== 'won' && l.status !== 'lost').length

  const handleLogin = (loginRole, memberInfo) => {
    setRole(loginRole)
    if (loginRole === 'team' && memberInfo) {
      setCurrentMember(memberInfo)
      const memberRole = memberInfo.role || 'sales'
      const firstView = TEAM_NAV[memberRole]?.[0]?.key || 'leads'
      setView(firstView)
    } else {
      setView('leads')
    }
  }

  const handleLogout = () => {
    setRole(null); setCurrentMember(null); setView('leads')
  }

  if (loading) return (
    <div style={{ background: B.ink, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY }}>
      <div style={{ color: B.mid, fontSize: 12, letterSpacing: '0.1em' }}>LOADING</div>
    </div>
  )

  if (!role) return <Login onLogin={handleLogin} adminPin={adminPin} team={team} isMobile={isMobile} />

  const isAdmin = role === 'admin'
  const memberRole = currentMember?.role || 'sales'
  const navItems = isAdmin ? ADMIN_NAV : (TEAM_NAV[memberRole] || TEAM_NAV.sales)

  const TITLE = {
    leads: 'LEADS', clients: 'CLIENTS', board: 'BOARD', myboard: 'MY BOARD',
    payments: 'PAYMENTS', events: 'EVENTS', repform: 'REP FORM',
    settings: 'SETTINGS', profile: 'MY PROFILE',
  }

  const badgeLabel = isAdmin ? 'ADMIN' : (currentMember?.name?.split(' ')[0]?.toUpperCase() || memberRole.toUpperCase())

  const renderView = () => {
    switch (view) {
      case 'leads':    return <LeadsView    leads={leads}       setLeads={setLeads}       role={isAdmin ? 'admin' : 'rep'} reps={team} isMobile={isMobile} />
      case 'clients':  return <ClientsView  clients={clients}   setClients={setClients}   isMobile={isMobile} />
      case 'board':    return <StaffBoardView tasks={boardTasks} setTasks={setBoardTasks} clients={clients} team={team} isMobile={isMobile} mode='admin' />
      case 'myboard':  return <StaffBoardView tasks={boardTasks} setTasks={setBoardTasks} clients={clients} team={team} isMobile={isMobile} mode='staff' currentMember={currentMember} />
      case 'payments': return <PaymentsView payments={payments} setPayments={setPayments} isMobile={isMobile} />
      case 'events':   return <EventsView   events={events}     setEvents={setEvents}     reps={team} role={isAdmin ? 'admin' : 'rep'} isMobile={isMobile} />
      case 'repform':  return <RepFormView  setLeads={setLeads} isMobile={isMobile} />
      case 'settings': return <SettingsView team={team} setTeam={setTeam} adminPin={adminPin} setAdminPin={setAdminPin} isMobile={isMobile} />
      case 'profile':  return <StaffProfileView member={currentMember} tasks={boardTasks} isMobile={isMobile} />
      default:         return null
    }
  }

  const mainContent = (
    <main style={{ flex: 1, padding: isMobile ? '20px 16px 80px' : '30px 36px', overflowY: 'auto', minWidth: 0 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 28 : 36, letterSpacing: '0.08em', color: B.bone, marginBottom: isMobile ? 16 : 24, lineHeight: 1 }}>
        {TITLE[view] || view.toUpperCase()}
      </div>
      {renderView()}
    </main>
  )

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: B.ink, fontFamily: FONT_BODY, color: B.bone }}>
        <div style={{ background: B.surface, borderBottom: `1px solid ${B.border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, letterSpacing: '0.14em', color: B.bone }}>FINS</div>
          <span style={{ color: B.mid, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{badgeLabel}</span>
        </div>
        {mainContent}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: B.surface, borderTop: `1px solid ${B.border}`, display: 'flex', overflowX: 'auto', zIndex: 100 }}>
          {navItems.map(({ key, Icon, label }) => {
            const active = view === key
            const badge = key === 'leads' && isAdmin ? overdueCt : null
            return (
              <button key={key} onClick={() => setView(key)} style={{ flex: '0 0 auto', minWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px 12px', background: 'none', border: 'none', cursor: 'pointer', color: active ? B.bone : B.mid, position: 'relative' }}>
                <Icon size={16} />
                <span style={{ fontSize: 8, fontFamily: FONT_BODY, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>{label}</span>
                {badge > 0 && <div style={{ position: 'absolute', top: 6, right: 12, background: '#FCA5A5', color: B.ink, borderRadius: 8, fontSize: 8, fontWeight: 800, padding: '1px 4px', fontFamily: FONT_BODY }}>{badge}</div>}
              </button>
            )
          })}
          <button onClick={handleLogout} style={{ flex: '0 0 auto', minWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px 12px', background: 'none', border: 'none', cursor: 'pointer', color: B.mid }}>
            <LogOut size={16} />
            <span style={{ fontSize: 8, fontFamily: FONT_BODY, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>OUT</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: B.ink, fontFamily: FONT_BODY, color: B.bone }}>
      <aside style={{ width: 196, background: B.surface, borderRight: `1px solid ${B.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '24px 20px 18px', borderBottom: `1px solid ${B.border}` }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, letterSpacing: '0.14em', color: B.bone, lineHeight: 1 }}>FINS</div>
          <div style={{ color: B.mid, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 3 }}>CREATIVE &amp; MARKETING</div>
        </div>
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${B.border}` }}>
          <span style={{ color: B.mid, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{badgeLabel}</span>
        </div>
        <nav style={{ padding: '8px 10px', flex: 1 }}>
          {navItems.map(({ key, Icon, label }) => {
            const active = view === key
            const badge = key === 'leads' && isAdmin ? overdueCt : null
            return (
              <button key={key} onClick={() => setView(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 3, border: 'none', cursor: 'pointer', background: active ? 'rgba(245,242,237,0.06)' : 'transparent', color: active ? B.bone : B.mid, fontFamily: FONT_DISPLAY, fontSize: 15, letterSpacing: '0.1em', marginBottom: 2, textAlign: 'left', transition: 'background 0.1s, color 0.1s' }}>
                <Icon size={13} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge > 0 && <span style={{ background: 'rgba(252,165,165,0.15)', color: '#FCA5A5', borderRadius: 2, fontSize: 9, fontWeight: 800, padding: '1px 5px', fontFamily: FONT_BODY }}>{badge}</span>}
              </button>
            )
          })}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${B.border}` }}>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 3, border: 'none', background: 'transparent', color: B.mid, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </aside>
      {mainContent}
    </div>
  )
}
