export const B = {
  ink:      '#0D0D0D',
  bone:     '#F5F2ED',
  mid:      '#888580',
  light:    '#D8D4CE',
  surface:  '#141414',
  card:     '#191919',
  border:   '#242424',
}

export const FONT_DISPLAY = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"
export const FONT_BODY    = 'Helvetica, Arial, sans-serif'

export const STATUS_STYLE = {
  new:       { bg:'transparent',            text:'#888580', border:'rgba(136,133,128,0.4)' },
  contacted: { bg:'transparent',            text:'#F5F2ED', border:'rgba(245,242,237,0.25)' },
  proposal:  { bg:'rgba(245,242,237,0.07)', text:'#F5F2ED', border:'rgba(245,242,237,0.3)' },
  won:       { bg:'rgba(16,185,129,0.1)',   text:'#6EE7B7', border:'rgba(16,185,129,0.3)' },
  lost:      { bg:'transparent',            text:'#888580', border:'rgba(136,133,128,0.2)' },
}

export const PAY_STYLE = {
  pending: { bg:'transparent',            text:'#888580', border:'rgba(136,133,128,0.4)' },
  paid:    { bg:'rgba(16,185,129,0.1)',   text:'#6EE7B7', border:'rgba(16,185,129,0.3)' },
  overdue: { bg:'rgba(239,68,68,0.1)',    text:'#FCA5A5', border:'rgba(239,68,68,0.3)'  },
}

export const STAGES = [
  { key:'new',       label:'New'           },
  { key:'contacted', label:'Contacted'     },
  { key:'proposal',  label:'Proposal Sent' },
  { key:'won',       label:'Won'           },
  { key:'lost',      label:'Lost'          },
]

export const PAY_STATUS = [
  { key:'pending', label:'Pending' },
  { key:'paid',    label:'Paid'    },
  { key:'overdue', label:'Overdue' },
]

export const SERVICES = [
  'Full Service','Paid Ads','SEO','Social Media',
  'Web Dev','Photography','Videography','Email/SMS','CRM','Branding','Other',
]
