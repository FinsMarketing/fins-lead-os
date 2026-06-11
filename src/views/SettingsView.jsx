import { useState } from 'react'
import { Plus, Trash2, Lock } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY } from '../brand'
import { Btn } from '../components/Shared'
import { insertRep, deleteRep, setSetting } from '../lib/db'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export default function SettingsView({ reps, setReps, adminPin, repCode, setAdminPin, setRepCode }) {
  const [repName, setRepName] = useState('')
  const [nAdmin,  setNAdmin]  = useState('')
  const [nRep,    setNRep]    = useState('')
  const [saved,   setSaved]   = useState('')

  const addRep = async () => {
    if (!repName.trim()) return
    try {
      const rep = await insertRep(repName.trim())
      setReps(prev => [...prev, rep])
      setRepName('')
    } catch (e) { console.error(e) }
  }

  const remRep = async id => {
    try {
      await deleteRep(id)
      setReps(prev => prev.filter(r => r.id !== id))
    } catch (e) { console.error(e) }
  }

  const savePins = async () => {
    try {
      if (nAdmin.trim()) { await setSetting('admin_pin', nAdmin.trim()); setAdminPin(nAdmin.trim()) }
      if (nRep.trim())   { await setSetting('rep_code',  nRep.trim());   setRepCode(nRep.trim())   }
      setSaved('Saved.'); setNAdmin(''); setNRep('')
      setTimeout(() => setSaved(''), 2000)
    } catch (e) { console.error(e) }
  }

  const inp = { background: B.card, border: `1px solid ${B.border}`, borderRadius: 4, padding: '9px 12px', color: B.bone, fontSize: 13, fontFamily: FONT_BODY, outline: 'none' }

  return (
    <div style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 22 }}>
        <div style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: '0.08em', marginBottom: 4 }}>SALES REPS</div>
        <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY, marginBottom: 18 }}>Reps can be assigned to events and submit leads</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <input value={repName} onChange={e => setRepName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRep()}
            placeholder="Rep's name" style={{ ...inp, flex: 1 }} />
          <Btn onClick={addRep} disabled={!repName.trim()}><Plus size={12} /> ADD</Btn>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reps.length === 0 && <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>No reps yet</div>}
          {reps.map(rep => (
            <div key={rep.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: B.card, borderRadius: 4, padding: '10px 14px' }}>
              <span style={{ color: B.bone, fontWeight: 700, fontSize: 14, fontFamily: FONT_BODY }}>{rep.name}</span>
              <Btn variant='danger' size='sm' onClick={() => remRep(rep.id)}><Trash2 size={11} /></Btn>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Lock size={12} style={{ color: B.mid }} />
          <span style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: '0.08em' }}>ACCESS CODES</span>
        </div>
        <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY, marginBottom: 18 }}>
          Current admin PIN: <span style={{ color: B.light }}>{adminPin}</span> &nbsp;·&nbsp; Rep code: <span style={{ color: B.light }}>{repCode}</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: B.mid, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FONT_BODY, marginBottom: 5 }}>New Admin PIN</div>
          <input type='password' value={nAdmin} onChange={e => setNAdmin(e.target.value)} placeholder='Leave blank to keep current' style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: B.mid, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FONT_BODY, marginBottom: 5 }}>New Rep Code</div>
          <input type='password' value={nRep} onChange={e => setNRep(e.target.value)} placeholder='Leave blank to keep current' style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Btn onClick={savePins} disabled={!nAdmin && !nRep}>UPDATE</Btn>
          {saved && <span style={{ color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>{saved}</span>}
        </div>
      </div>
    </div>
  )
}
