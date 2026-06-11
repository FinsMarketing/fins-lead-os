import { X } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY, STATUS_STYLE, PAY_STYLE, STAGES, PAY_STATUS } from '../brand'

const CLIENT_STYLE = {
  active:  { bg:'rgba(16,185,129,0.1)',  text:'#6EE7B7', border:'rgba(16,185,129,0.3)' },
  paused:  { bg:'rgba(253,230,138,0.1)', text:'#FDE68A', border:'rgba(253,230,138,0.3)' },
  churned: { bg:'transparent',           text:'#888580', border:'rgba(136,133,128,0.3)' },
}

export function Badge({ label, statusKey, type = 'stage' }) {
  const s = type === 'pay' ? (PAY_STYLE[statusKey] || PAY_STYLE.pending)
          : type === 'client' ? (CLIENT_STYLE[statusKey] || CLIENT_STYLE.active)
          : (STATUS_STYLE[statusKey] || STATUS_STYLE.new)
  return (
    <span style={{
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 3, padding: '2px 8px', fontSize: 10,
      fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      fontFamily: FONT_BODY, whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, full, type = 'button' }) {
  const vs = {
    primary: { background: B.bone,        color: B.ink,  border: 'none' },
    ghost:   { background: 'transparent', color: B.mid,  border: `1px solid ${B.border}` },
    danger:  { background: 'transparent', color: B.mid,  border: `1px solid ${B.border}` },
    outline: { background: 'transparent', color: B.bone, border: `1px solid rgba(245,242,237,0.2)` },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...vs[variant], borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 700, fontFamily: FONT_BODY, fontSize: size === 'sm' ? 11 : 13,
      letterSpacing: '0.05em', textTransform: 'uppercase',
      padding: size === 'sm' ? '4px 10px' : '9px 18px',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      opacity: disabled ? 0.35 : 1, width: full ? '100%' : 'auto',
      justifyContent: full ? 'center' : 'flex-start', transition: 'opacity 0.1s',
    }}>{children}</button>
  )
}

export function Field({ label, value, onChange, type = 'text', placeholder, options, required }) {
  const base = {
    width: '100%', background: B.card, border: `1px solid ${B.border}`,
    borderRadius: 4, padding: '9px 12px', color: B.bone, fontSize: 14,
    fontFamily: FONT_BODY, outline: 'none', boxSizing: 'border-box', letterSpacing: '0.01em',
  }
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ color: B.mid, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FONT_BODY, display: 'block', marginBottom: 5 }}>
          {label}{required && <span style={{ color: B.mid }}> *</span>}
        </label>
      )}
      {options
        ? <select value={value} onChange={e => onChange(e.target.value)} style={{ ...base, cursor: 'pointer' }}>
            <option value=''>Select…</option>
            {options.map(o => <option key={o.key || o} value={o.key || o}>{o.label || o}</option>)}
          </select>
        : type === 'textarea'
          ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: 'vertical' }} />
          : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      }
    </div>
  )
}

export function Modal({ title, onClose, children, maxWidth = 520 }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 6, width: '100%', maxWidth, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${B.border}` }}>
          <span style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 22, letterSpacing: '0.08em' }}>{title.toUpperCase()}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: B.mid, cursor: 'pointer', display: 'flex', padding: 4 }}><X size={17} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

export function Stat({ label, value }) {
  return (
    <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: '18px 20px' }}>
      <div style={{ color: B.mid, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FONT_BODY, marginBottom: 8 }}>{label}</div>
      <div style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 34, letterSpacing: '0.04em', lineHeight: 1 }}>{value}</div>
    </div>
  )
}
