import { useState } from 'react'
import { Plus, Trash2, Lock, User, Edit2 } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY } from '../brand'
import { Btn, Field, Modal } from '../components/Shared'
import { upsertTeamMember, deleteTeamMember, setSetting } from '../lib/db'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const ROLES = [
  { key: 'sales',     label: 'Sales' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'delivery',  label: 'Delivery' },
]
const EMPTY = { name:'', email:'', password:'', role:'sales', profilePic:'' }

export default function SettingsView({ team, setTeam, adminPin, setAdminPin }) {
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState({})
  const [saving, setSaving] = useState(false)
  const [nAdmin, setNAdmin] = useState('')
  const [saved,  setSaved]  = useState('')
  const ff = k => v => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.name || !form.email || !form.password) return
    setSaving(true)
    try {
      const saved = await upsertTeamMember(modal === 'add' ? { ...form, id: uid() } : form)
      setTeam(prev => modal === 'add' ? [...prev, saved] : prev.map(t => t.id === saved.id ? saved : t))
      setModal(null)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const remove = async id => {
    if (!confirm('Delete this team member?')) return
    try { await deleteTeamMember(id); setTeam(prev => prev.filter(t => t.id !== id)) }
    catch (e) { console.error(e) }
  }

  const savePin = async () => {
    if (!nAdmin.trim()) return
    try {
      await setSetting('admin_pin', nAdmin.trim())
      setAdminPin(nAdmin.trim())
      setSaved('Saved.'); setNAdmin('')
      setTimeout(() => setSaved(''), 2000)
    } catch (e) { console.error(e) }
  }

  const inp = { background: B.card, border: `1px solid ${B.border}`, borderRadius: 4, padding: '9px 12px', color: B.bone, fontSize: 13, fontFamily: FONT_BODY, outline: 'none' }

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: '0.08em' }}>TEAM</div>
          <Btn size='sm' onClick={() => { setForm({ ...EMPTY }); setModal('add') }}><Plus size={12} /> ADD MEMBER</Btn>
        </div>
        <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY, marginBottom: 18 }}>Members log in with their email and password. Each sees their own kanban board.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {team.length === 0 && <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>No team members yet</div>}
          {team.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: B.card, borderRadius: 4, padding: '10px 14px', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                {t.profilePic ? (
                  <img src={t.profilePic} alt='' style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: B.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={14} style={{ color: B.mid }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: B.bone, fontWeight: 700, fontSize: 14, fontFamily: FONT_BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                  <div style={{ color: B.mid, fontSize: 11, fontFamily: FONT_BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.email} · {ROLES.find(r => r.key === t.role)?.label || t.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn variant='ghost' size='sm' onClick={() => { setForm({ ...t }); setModal('edit') }}><Edit2 size={11} /></Btn>
                <Btn variant='danger' size='sm' onClick={() => remove(t.id)}><Trash2 size={11} /></Btn>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Lock size={12} style={{ color: B.mid }} />
          <span style={{ color: B.bone, fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: '0.08em' }}>ADMIN PIN</span>
        </div>
        <div style={{ color: B.mid, fontSize: 13, fontFamily: FONT_BODY, marginBottom: 18 }}>Current: <span style={{ color: B.light }}>{adminPin}</span></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type='password' value={nAdmin} onChange={e => setNAdmin(e.target.value)} placeholder='New PIN' style={{ ...inp, flex: 1 }} />
          <Btn onClick={savePin} disabled={!nAdmin.trim()}>UPDATE</Btn>
          {saved && <span style={{ color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>{saved}</span>}
        </div>
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'New Team Member' : 'Edit Team Member'} onClose={() => setModal(null)}>
          <Field label='Full Name' value={form.name || ''} onChange={ff('name')} required placeholder='Jane Smith' />
          <Field label='Email (login)' value={form.email || ''} onChange={ff('email')} required type='email' placeholder='jane@finsmarketingco.com' />
          <Field label='Password' value={form.password || ''} onChange={ff('password')} required placeholder='At least 6 characters' />
          <Field label='Role' value={form.role || 'sales'} onChange={ff('role')} options={ROLES.map(r => ({ key: r.key, label: r.label }))} />
          <Field label='Profile Picture URL (optional)' value={form.profilePic || ''} onChange={ff('profilePic')} placeholder='https://…' />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Btn variant='ghost' onClick={() => setModal(null)}>CANCEL</Btn>
            <Btn onClick={save} disabled={!form.name || !form.email || !form.password || saving}>{saving ? 'SAVING…' : 'SAVE'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
