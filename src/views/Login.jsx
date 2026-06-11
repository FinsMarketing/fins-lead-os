import { useState } from 'react'
import { Shield, Users, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { B, FONT_DISPLAY, FONT_BODY } from '../brand'
import { Btn } from '../components/Shared'

export default function Login({ onLogin, adminPin, repCode }) {
  const [mode, setMode] = useState(null)
  const [pin,  setPin]  = useState('')
  const [err,  setErr]  = useState('')
  const [show, setShow] = useState(false)

  const attempt = () => {
    const correct = mode === 'admin' ? adminPin : repCode
    if (pin === correct) {
      onLogin(mode)
    } else {
      setErr('Incorrect.')
      setPin('')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: B.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY, padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 64, letterSpacing: '0.12em', color: B.bone, lineHeight: 1 }}>FINS</div>
          <div style={{ color: B.mid, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4 }}>CREATIVE &amp; MARKETING AGENCY</div>
          <div style={{ width: 1, height: 32, background: B.border, margin: '16px auto 0' }} />
        </div>

        {!mode ? (
          <>
            <div style={{ color: B.mid, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 }}>ACCESS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { k: 'admin', title: 'Admin',     sub: 'Full access — payments, settings, all data', Icon: Shield },
                { k: 'rep',   title: 'Sales Rep',  sub: 'Leads, events, submit form',                Icon: Users  },
              ].map(({ k, title, sub, Icon }) => (
                <button key={k} onClick={() => { setMode(k); setErr(''); setPin('') }} style={{
                  background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4,
                  padding: '18px 20px', cursor: 'pointer', textAlign: 'left', fontFamily: FONT_BODY,
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <Icon size={15} style={{ color: B.mid, flexShrink: 0 }} />
                  <div>
                    <div style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 18, letterSpacing: '0.08em' }}>{title.toUpperCase()}</div>
                    <div style={{ color: B.mid, fontSize: 12, marginTop: 2 }}>{sub}</div>
                  </div>
                  <ChevronRight size={13} style={{ color: B.mid, marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => { setMode(null); setPin(''); setErr('') }} style={{ background: 'none', border: 'none', color: B.mid, cursor: 'pointer', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24, padding: 0, fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: 6 }}>
              ← BACK
            </button>
            <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 28 }}>
              <div style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 22, letterSpacing: '0.08em', marginBottom: 4 }}>
                {mode === 'admin' ? 'ADMIN PIN' : 'REP ACCESS CODE'}
              </div>
              <div style={{ color: B.mid, fontSize: 13, marginBottom: 22 }}>
                {mode === 'admin' ? 'Your private admin PIN' : 'Shared rep access code'}
              </div>
              <div style={{ position: 'relative', marginBottom: err ? 10 : 14 }}>
                <input
                  type={show ? 'text' : 'password'}
                  value={pin}
                  onChange={e => { setPin(e.target.value); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && attempt()}
                  placeholder='Enter code'
                  autoFocus
                  style={{ width: '100%', background: B.card, border: `1px solid ${err ? 'rgba(239,68,68,0.5)' : B.border}`, borderRadius: 4, padding: '10px 40px 10px 12px', color: B.bone, fontSize: 15, fontFamily: FONT_BODY, outline: 'none', boxSizing: 'border-box', letterSpacing: '0.1em' }}
                />
                <button onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: B.mid, display: 'flex' }}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {err && <div style={{ color: '#FCA5A5', fontSize: 12, fontFamily: FONT_BODY, marginBottom: 12 }}>{err}</div>}
              <Btn onClick={attempt} disabled={!pin} full>ENTER <ChevronRight size={13} /></Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
