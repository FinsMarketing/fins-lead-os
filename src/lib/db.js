import { supabase, hasSupabase } from './supabase'

const lsGet = (key) => { try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] } }
const lsSet = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }
const lsGetOne = (key, fb = null) => { try { return JSON.parse(localStorage.getItem(key)) ?? fb } catch { return fb } }
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

const toLead = r => ({ id:r.id, name:r.name, company:r.company, email:r.email, phone:r.phone, service:r.service, status:r.status, notes:r.notes, followUpDate:r.follow_up_date, source:r.source, assignedRep:r.assigned_rep, createdAt:r.created_at })
const fromLead = l => ({ id:l.id||uid(), name:l.name, company:l.company||null, email:l.email||null, phone:l.phone||null, service:l.service||null, status:l.status||'new', notes:l.notes||null, follow_up_date:l.followUpDate||null, source:l.source||null, assigned_rep:l.assignedRep||null })
const toPayment = r => ({ id:r.id, clientName:r.client_name, amount:r.amount, status:r.status, dueDate:r.due_date, description:r.description, invoiceNumber:r.invoice_number, isRecurring:r.is_recurring, createdAt:r.created_at })
const fromPayment = p => ({ id:p.id||uid(), client_name:p.clientName, amount:p.amount||0, status:p.status||'pending', due_date:p.dueDate||null, description:p.description||null, invoice_number:p.invoiceNumber||null, is_recurring:p.isRecurring||false })
const toEvent = r => ({ id:r.id, url:r.url, name:r.name, date:r.date, location:r.location, description:r.description, assignedReps:r.assigned_reps||[], createdAt:r.created_at })
const fromEvent = e => ({ id:e.id||uid(), url:e.url||null, name:e.name||null, date:e.date||null, location:e.location||null, description:e.description||null, assigned_reps:e.assignedReps||[] })
const toClient = r => ({ id:r.id, name:r.name, contactName:r.contact_name, email:r.email, phone:r.phone, service:r.service, monthlyValue:r.monthly_value, startDate:r.start_date, notes:r.notes, status:r.status, createdAt:r.created_at })
const fromClient = c => ({ id:c.id||uid(), name:c.name, contact_name:c.contactName||null, email:c.email||null, phone:c.phone||null, service:c.service||null, monthly_value:c.monthlyValue||null, start_date:c.startDate||null, notes:c.notes||null, status:c.status||'active' })
const toTeamMember = r => ({ id:r.id, name:r.name, role:r.role||'sales', email:r.email, password:r.password, profilePic:r.profile_pic, addedAt:r.added_at })
const fromTeamMember = m => ({ id:m.id||uid(), name:m.name, role:m.role||'sales', email:m.email||null, password:m.password||null, profile_pic:m.profilePic||null })
const toBoardTask = r => ({ id:r.id, clientName:r.client_name, title:r.title, description:r.description, status:r.status, assignedTo:r.assigned_to, color:r.color, position:r.position, price:r.price||0, paid:r.paid||false, paidAt:r.paid_at, completedAt:r.completed_at, createdAt:r.created_at })
const fromBoardTask = t => ({ id:t.id||uid(), client_name:t.clientName, title:t.title, description:t.description||null, status:t.status||'assigned', assigned_to:t.assignedTo||null, color:t.color||null, position:t.position||0, price:t.price||0, paid:t.paid||false, paid_at:t.paidAt||null, completed_at:t.completedAt||null })

export async function fetchLeads() {
  if (!hasSupabase) return lsGet('fins_leads')
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (error) { console.error(error); return lsGet('fins_leads') }
  return data.map(toLead)
}
export async function upsertLead(lead) {
  if (!hasSupabase) { const all = lsGet('fins_leads'); const i = all.findIndex(l => l.id === lead.id); const updated = i >= 0 ? all.map(l => l.id === lead.id ? lead : l) : [lead, ...all]; lsSet('fins_leads', updated); return lead }
  const { data, error } = await supabase.from('leads').upsert(fromLead(lead)).select().single()
  if (error) throw error
  return toLead(data)
}
export async function deleteLead(id) {
  if (!hasSupabase) { lsSet('fins_leads', lsGet('fins_leads').filter(l => l.id !== id)); return }
  await supabase.from('leads').delete().eq('id', id)
}

export async function fetchPayments() {
  if (!hasSupabase) return lsGet('fins_payments')
  const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false })
  if (error) { console.error(error); return lsGet('fins_payments') }
  return data.map(toPayment)
}
export async function upsertPayment(p) {
  if (!hasSupabase) { const all = lsGet('fins_payments'); const i = all.findIndex(x => x.id === p.id); const updated = i >= 0 ? all.map(x => x.id === p.id ? p : x) : [p, ...all]; lsSet('fins_payments', updated); return p }
  const { data, error } = await supabase.from('payments').upsert(fromPayment(p)).select().single()
  if (error) throw error
  return toPayment(data)
}
export async function deletePayment(id) {
  if (!hasSupabase) { lsSet('fins_payments', lsGet('fins_payments').filter(p => p.id !== id)); return }
  await supabase.from('payments').delete().eq('id', id)
}

export async function fetchEvents() {
  if (!hasSupabase) return lsGet('fins_events')
  const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
  if (error) { console.error(error); return lsGet('fins_events') }
  return data.map(toEvent)
}
export async function upsertEvent(e) {
  if (!hasSupabase) { const all = lsGet('fins_events'); const i = all.findIndex(x => x.id === e.id); const updated = i >= 0 ? all.map(x => x.id === e.id ? e : x) : [e, ...all]; lsSet('fins_events', updated); return e }
  const { data, error } = await supabase.from('events').upsert(fromEvent(e)).select().single()
  if (error) throw error
  return toEvent(data)
}
export async function deleteEvent(id) {
  if (!hasSupabase) { lsSet('fins_events', lsGet('fins_events').filter(e => e.id !== id)); return }
  await supabase.from('events').delete().eq('id', id)
}
export async function cleanupPastEvents() {
  const today = new Date().toISOString().split('T')[0]
  const events = await fetchEvents()
  const past = events.filter(e => {
    if (!e.date) return false
    const parsed = new Date(e.date)
    if (isNaN(parsed)) return false
    return parsed.toISOString().split('T')[0] < today
  })
  for (const p of past) await deleteEvent(p.id)
  return past.length
}

export async function fetchTeam() {
  if (!hasSupabase) return lsGet('fins_reps').map(r => ({ id:r.id, name:r.name, role:r.role||'sales', email:r.email, password:r.password, profilePic:r.profilePic, addedAt:r.addedAt }))
  const { data, error } = await supabase.from('reps').select('*').order('added_at', { ascending: true })
  if (error) { console.error(error); return lsGet('fins_reps') }
  return data.map(toTeamMember)
}
export async function upsertTeamMember(m) {
  if (!hasSupabase) { const all = lsGet('fins_reps'); const i = all.findIndex(x => x.id === m.id); const updated = i >= 0 ? all.map(x => x.id === m.id ? m : x) : [m, ...all]; lsSet('fins_reps', updated); return m }
  const { data, error } = await supabase.from('reps').upsert(fromTeamMember(m)).select().single()
  if (error) throw error
  return toTeamMember(data)
}
export async function deleteTeamMember(id) {
  if (!hasSupabase) { lsSet('fins_reps', lsGet('fins_reps').filter(r => r.id !== id)); return }
  await supabase.from('reps').delete().eq('id', id)
}

export async function fetchClients() {
  if (!hasSupabase) return lsGet('fins_clients')
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
  if (error) { console.error(error); return lsGet('fins_clients') }
  return data.map(toClient)
}
export async function upsertClient(c) {
  if (!hasSupabase) { const all = lsGet('fins_clients'); const i = all.findIndex(x => x.id === c.id); const updated = i >= 0 ? all.map(x => x.id === c.id ? c : x) : [c, ...all]; lsSet('fins_clients', updated); return c }
  const { data, error } = await supabase.from('clients').upsert(fromClient(c)).select().single()
  if (error) throw error
  return toClient(data)
}
export async function deleteClient(id) {
  if (!hasSupabase) { lsSet('fins_clients', lsGet('fins_clients').filter(c => c.id !== id)); return }
  await supabase.from('clients').delete().eq('id', id)
}

export async function fetchBoardTasks() {
  if (!hasSupabase) return lsGet('fins_board_tasks')
  const { data, error } = await supabase.from('board_tasks').select('*').order('position', { ascending: true })
  if (error) { console.error(error); return lsGet('fins_board_tasks') }
  return data.map(toBoardTask)
}
export async function upsertBoardTask(t) {
  if (!hasSupabase) { const all = lsGet('fins_board_tasks'); const i = all.findIndex(x => x.id === t.id); const updated = i >= 0 ? all.map(x => x.id === t.id ? t : x) : [t, ...all]; lsSet('fins_board_tasks', updated); return t }
  const { data, error } = await supabase.from('board_tasks').upsert(fromBoardTask(t)).select().single()
  if (error) throw error
  return toBoardTask(data)
}
export async function deleteBoardTask(id) {
  if (!hasSupabase) { lsSet('fins_board_tasks', lsGet('fins_board_tasks').filter(t => t.id !== id)); return }
  await supabase.from('board_tasks').delete().eq('id', id)
}

export async function getSetting(key) {
  if (!hasSupabase) return (lsGetOne('fins_settings', {}))[key] || null
  const { data } = await supabase.from('settings').select('value').eq('key', key).single()
  return data?.value || null
}
export async function setSetting(key, value) {
  if (!hasSupabase) { const s = lsGetOne('fins_settings', {}); s[key] = value; localStorage.setItem('fins_settings', JSON.stringify(s)); return }
  await supabase.from('settings').upsert({ key, value })
}
