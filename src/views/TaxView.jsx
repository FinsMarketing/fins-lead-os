import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react'
import { B, FONT_BODY, FONT_DISPLAY } from '../brand'
import { Btn, Field, Modal, Stat } from '../components/Shared'
import { fetchTaxEntries, upsertTaxEntry, deleteTaxEntry } from '../lib/db'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const fmt = (n, cur = 'AUD') => `${cur} ${Number(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const CURRENCIES = ['AUD', 'USD', 'GBP', 'EUR', 'AED', 'NZD', 'CAD', 'JPY', 'SGD']
const EMPTY = { entryType:'income', entryDate:'', description:'', amount:'', currency:'AUD', category:'', invoiceUrl:'' }

const todayStr = () => new Date().toISOString().slice(0, 10)
const thisMonthKey = () => new Date().toISOString().slice(0, 7)
const thisYearKey  = () => new Date().toISOString().slice(0, 4)
const daysAgoStr = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }

export default function TaxView({ isMobile }) {
  const [entries,   setEntries]   = useState([])
  const [tab,       setTab]       = useState('income')  // 'income' | 'expense'
  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState({})
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)
  const ff = k => v => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    fetchTaxEntries().then(setEntries).catch(console.error).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!form.description || !form.amount || !form.entryDate) return
    setSaving(true)
    try {
      const isNew = modal === 'add'
      const saved = await upsertTaxEntry(isNew ? { ...form, id: uid() } : form)
      setEntries(prev => isNew ? [saved, ...prev] : prev.map(e => e.id === saved.id ? saved : e))
      setModal(null); setForm({})
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete this entry?')) return
    try { await deleteTaxEntry(id); setEntries(prev => prev.filter(e => e.id !== id)) }
    catch (e) { console.error(e) }
  }

  const rows = entries.filter(e => e.entryType === tab).sort((a, b) => (b.entryDate || '').localeCompare(a.entryDate || ''))

  // Group by currency for totals
  const totalByCurrency = (subset) => {
    const map = {}
    subset.forEach(e => {
      const cur = e.currency || 'AUD'
      if (!map[cur]) map[cur] = 0
      map[cur] += Number(e.amount || 0)
    })
    return map
  }

  const today = todayStr()
  const monthStart = thisMonthKey() + '-01'
  const yearStart  = thisYearKey() + '-01-01'
  const last30 = daysAgoStr(30)

  const thisMonth = rows.filter(e => (e.entryDate || '') >= monthStart)
  const last30Days = rows.filter(e => (e.entryDate || '') >= last30)
  const thisYear = rows.filter(e => (e.entryDate || '') >= yearStart)
  const allTime = rows

  // Category breakdown for current tab
  const byCategory = rows.reduce((acc, e) => {
    const cat = e.category || 'Uncategorized'
    if (!acc[cat]) acc[cat] = { total: 0, byCurrency: {}, count: 0 }
    acc[cat].total += Number(e.amount || 0)
    acc[cat].count += 1
    const cur = e.currency || 'AUD'
    if (!acc[cat].byCurrency[cur]) acc[cat].byCurrency[cur] = 0
    acc[cat].byCurrency[cur] += Number(e.amount || 0)
    return acc
  }, {})

  const formatTotals = (subset) => {
    const t = totalByCurrency(subset)
    const keys = Object.keys(t)
    if (keys.length === 0) return '—'
    if (keys.length === 1) return fmt(t[keys[0]], keys[0])
    return keys.map(k => fmt(t[k], k)).join(' · ')
  }

  if (loading) return <div style={{ color: B.mid, fontSize: 12, letterSpacing: '0.1em' }}>LOADING</div>

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[['income', 'Income'], ['expense', 'Expenses']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: tab === key ? 'rgba(245,242,237,0.08)' : 'transparent',
            border: `1px solid ${tab === key ? 'rgba(245,242,237,0.25)' : B.border}`,
            borderRadius: 4, padding: '7px 14px', cursor: 'pointer',
            color: tab === key ? B.bone : B.mid, fontSize: 12, fontWeight: 700,
            fontFamily: FONT_BODY, letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>{label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <Btn onClick={() => { setForm({ ...EMPTY, entryType: tab, entryDate: today }); setModal('add') }}>
          <Plus size={13} /> ADD {tab.toUpperCase()}
        </Btn>
      </div>

      {/* Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <Stat label='This Month' value={formatTotals(thisMonth)} />
        <Stat label='Last 30 Days' value={formatTotals(last30Days)} />
        <Stat label='This Year' value={formatTotals(thisYear)} />
        <Stat label='All Time' value={formatTotals(allTime)} />
      </div>

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, padding: 18, marginBottom: 20 }}>
          <div style={{ color: B.mid, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FONT_BODY, marginBottom: 12 }}>By Category (all time)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total).map(([cat, data]) => {
              const parts = Object.entries(data.byCurrency).map(([cur, amt]) => fmt(amt, cur))
              return (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${B.border}` }}>
                  <div>
                    <span style={{ color: B.bone, fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY }}>{cat}</span>
                    <span style={{ color: B.mid, fontSize: 11, marginLeft: 8, fontFamily: FONT_BODY }}>{data.count} entr{data.count === 1 ? 'y' : 'ies'}</span>
                  </div>
                  <span style={{ color: B.bone, fontFamily: FONT_BODY, fontSize: 13 }}>{parts.join(' · ')}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Entries list */}
      <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 4, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${B.border}` }}>
              {['Date', 'Description', 'Category', 'Amount', 'Invoice', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: B.mid, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT_BODY, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} style={{ padding: '36px 0', textAlign: 'center', color: B.mid, fontSize: 13, fontFamily: FONT_BODY }}>No {tab} entries</td></tr>}
            {rows.map(e => (
              <tr key={e.id} style={{ borderBottom: `1px solid ${B.border}` }}>
                <td style={{ padding: '12px 14px', color: B.mid, fontSize: 12, fontFamily: FONT_BODY, whiteSpace: 'nowrap' }}>{e.entryDate}</td>
                <td style={{ padding: '12px 14px', color: B.bone, fontSize: 13, fontFamily: FONT_BODY }}>{e.description}</td>
                <td style={{ padding: '12px 14px', color: B.mid, fontSize: 12, fontFamily: FONT_BODY }}>{e.category || '—'}</td>
                <td style={{ padding: '12px 14px', color: B.bone, fontFamily: FONT_BODY, fontSize: 13, whiteSpace: 'nowrap' }}>{fmt(e.amount, e.currency)}</td>
                <td style={{ padding: '12px 14px' }}>
                  {e.invoiceUrl ? (
                    <a href={e.invoiceUrl} target='_blank' rel='noopener noreferrer' style={{ display: 'inline-flex', color: B.mid }}>
                      <ExternalLink size={12} />
                    </a>
                  ) : <span style={{ color: B.border }}>—</span>}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn variant='ghost' size='sm' onClick={() => { setForm({ ...e }); setModal('edit') }}><Edit2 size={11} /></Btn>
                    <Btn variant='danger' size='sm' onClick={() => del(e.id)}><Trash2 size={11} /></Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === 'add' ? `New ${form.entryType}` : `Edit ${form.entryType}`} onClose={() => setModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 12px' }}>
            <Field label='Type' value={form.entryType || 'income'} onChange={ff('entryType')} options={[{ key: 'income', label: 'Income' }, { key: 'expense', label: 'Expense' }]} />
            <Field label='Date' value={form.entryDate || ''} onChange={ff('entryDate')} type='date' required />
            <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}><Field label='Description' value={form.description || ''} onChange={ff('description')} required placeholder='Client retainer / Adobe subscription…' /></div>
            <Field label='Amount' value={form.amount || ''} onChange={ff('amount')} type='number' required placeholder='1000' />
            <Field label='Currency' value={form.currency || 'AUD'} onChange={ff('currency')} options={CURRENCIES.map(c => ({ key: c, label: c }))} />
            <Field label='Category' value={form.category || ''} onChange={ff('category')} placeholder='Retainer, Software, Travel…' />
            <Field label='Invoice URL' value={form.invoiceUrl || ''} onChange={ff('invoiceUrl')} placeholder='https://… (optional)' />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Btn variant='ghost' onClick={() => setModal(null)}>CANCEL</Btn>
            <Btn onClick={save} disabled={!form.description || !form.amount || !form.entryDate || saving}>{saving ? 'SAVING…' : 'SAVE'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
