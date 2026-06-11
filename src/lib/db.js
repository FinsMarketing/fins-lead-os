import { supabase, hasSupabase } from './supabase'

// ── localStorage fallback ─────────────────────────────────────────────────────
const lsGet = (key) => { try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] } }
const lsSet = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }
const lsGetOne = (key, fb = null) => { try { return JSON.parse(localStorage.getItem(key)) ?? fb } catch { return fb } }

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// ── Field transformers ────────────────────────────────────────────────────────
const toLead = r => ({ id:r.id, name:r.name, company:r.company, email:r.email, phone:r.phone, service:r.service, status:r.status, notes:r.notes, followUpDate:r.follow_up_date, source:r.source, assignedRep:r.assigned_rep, createdAt:r.created_at })
const fromLead = l => ({ id:l.id||uid(), name:l.name, company:l.company||null, email:l.email||null, phone:l.phone||null, service:l.service||null, status:l.status||'new', notes:l.notes||null, follow_up_date:l.followUpDate||null, source:l.source||null, assigned_rep:l.assignedRep||null })
const toPayment = r => ({ id:r.id, clientName:r.client_name, amount:r.amount, status:r.status, dueDate:r.due_date, description:r.description, invoiceNumber:r.invoice_number, isRecurring:r.is_recurring, createdAt:r.created_at })
const fromPayment = p => ({ id:p.id||uid(), client_name:p.clientName, amount:p.amount||0, status:p.status||'pending', due_date:p.dueDate||null, description:p.description||null, invoice_number:p.invoiceNumber||null, is_recurring:p.isRecurring||false })
const toEvent = r => ({ id:r.id, url:r.url, name:r.name, date:r.date, location:r.location, description:r.description, assignedReps:r.assigned_reps||[], createdAt:r.created_at })
const fromEvent = e => ({ id:e.id||uid(), url:e.url||null, name:e.name||null, date:e.date||null, location:e.location||null, description:e.description||null, assigned_reps:e.assignedReps||[] })
const toClient = r => ({ id:r.id, name:r.name, contactName:r.contact_name, email:r.email, phone:r.phone, service:r.service, monthlyValue:r.monthly_value, startDate:r.start_date, notes:r.notes, status:r.status, createdAt:r.created_at })
const fromClient = c => ({ id:c.id||uid(), name:c.name, contact_name:c.contactName||null, email:c.email||null, phone:c.phone||null, service:c.service||null, monthly_value:c.monthlyValue||null, start_date:c.startDate||null, notes:c.notes||null, status:c.status||'active' })

// ── Leads ─────────────────────────────────────────────────────────────────────
export async function fetchLeads() {
  if (!hasSupabase) return lsGet('fins_leads')
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (error) { console.error(error); return lsGet('fins_leads') }
  return data.map(toLead)
}
export async function upsertLead(lead) {
  if (!hasSupabase) {
    const all = lsGet('fins_leads'); const i = all.findIndex(l => l.id === lead.id)
    const updated = i >= 0 ? all.map(l => l.id === lead.id ? lead : l) : [lead, ...all]
    lsSet('fins_leads', updated); return lead
  }
  const row = fromLead(lead)
  const { data, error } = await supabase.from('leads').upsert(row).select().single()
  if (error) throw error
  return toLead(data)
}
export async function deleteLead(id) {
  if (!hasSupabase) { lsSet('fins_leads', lsGet('fins_leads').filter(l => l.id !== id)); return }
  await supabase.from('leads').delete().eq('id', id)
}

// ── Payments ──────────────────────────────────────────────────────────────────
export async function fetchPayments() {
  if (!hasSupabase) return lsGet('fins_payments')
  const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false })
  if (error) { console.error(error); return lsGet('fins_payments') }
  return data.map(toPayment)
}
export async function upsertPayment(p) {
  if (!hasSupabase) {
    const all = lsGet('fins_payments'); const i = all.findIndex(x => x.id === p.id)
    const updated = i >= 0 ? all.map(x => x.id === p.id ? p : x) : [p, ...all]
    lsSet('fins_payments', updated); return p
  }
  const { data, error } = await supabase.from('payments').upsert(fromPayment(p)).select().single()
  if (error) throw error
  return toPayment(data)
}
export async function deletePayment(id) {
  if (!hasSupabase) { lsSet('fins_payments', lsGet('fins_payments').filter(p => p.id !== id)); return }
  await supabase.from('payments').delete().eq('id', id)
}

// ── Events ────────────────────────────────────────────────────────────────────
export async function fetchEvents() {
  if (!hasSupabase) return lsGet('fins_events')
  const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
  if (error) { console.error(error); return lsGet('fins_events') }
  return data.map(toEvent)
}
export async function upsertEvent(e) {
  if (!hasSupabase) {
    const all = lsGet('fins_events'); const i = all.findIndex(x => x.id === e.id)
    const updated = i >= 0 ? all.map(x => x.id === e.id ? e : x) : [e, ...all]
    lsSet('fins_events', updated); return e
  }
  const { data, error } = await supabase.from('events').upsert(fromEvent(e)).select().single()
  if (error) throw error
  return toEvent(data)
}
export async function deleteEvent(id) {
  if (!hasSupabase) { lsSet('fins_events', lsGet('fins_events').filter(e => e.id !== id)); return }
  await supabase.from('events').delete().eq('id', id)
}

// ── Reps ──────────────────────────────────────────────────────────────────────
export async function fetchReps() {
  if (!hasSupabase) return lsGet('fins_reps')
  const { data, error } = await supabase.from('reps').select('*').order('added_at', { ascending: true })
  if (error) { console.error(error); return lsGet('fins_reps') }
  return data
}
export async function insertRep(name) {
  const rep = { id: uid(), name, added_at: new Date().toISOString() }
  if (!hasSupabase) { lsSet('fins_reps', [...lsGet('fins_reps'), rep]); return rep }
  const { data, error } = await supabase.from('reps').insert({ id: rep.id, name }).select().single()
  if (error) throw error
  return data
}
export async function deleteRep(id) {
  if (!hasSupabase) { lsSet('fins_reps', lsGet('fins_reps').filter(r => r.id !== id)); return }
  await supabase.from('reps').delete().eq('id', id)
}

// ── Clients ───────────────────────────────────────────────────────────────────
export async function fetchClients() {
  if (!hasSupabase) return lsGet('fins_clients')
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
  if (error) { console.error(error); return lsGet('fins_clients') }
  return data.map(toClient)
}
export async function upsertClient(c) {
  if (!hasSupabase) {
    const all = lsGet('fins_clients'); const i = all.findIndex(x => x.id === c.id)
    const updated = i >= 0 ? all.map(x => x.id === c.id ? c : x) : [c, ...all]
    lsSet('fins_clients', updated); return c
  }
  const { data, error } = await supabase.from('clients').upsert(fromClient(c)).select().single()
  if (error) throw error
  return toClient(data)
}
export async function deleteClient(id) {
  if (!hasSupabase) { lsSet('fins_clients', lsGet('fins_clients').filter(c => c.id !== id)); return }
  await supabase.from('clients').delete().eq('id', id)
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export async function fetchTasks() { return lsGet('fins_tasks') }
export async function saveTasks(tasks) { lsSet('fins_tasks', tasks) }

// ── Settings ──────────────────────────────────────────────────────────────────
export async function getSetting(key) {
  if (!hasSupabase) return (lsGetOne('fins_settings', {}))[key] || null
  const { data } = await supabase.from('settings').select('value').eq('key', key).single()
  return data?.value || null
}
export async function setSetting(key, value) {
  if (!hasSupabase) { const s = lsGetOne('fins_settings', {}); s[key] = value; localStorage.setItem('fins_settings', JSON.stringify(s)); return }
  await supabase.from('settings').upsert({ key, value })
}
