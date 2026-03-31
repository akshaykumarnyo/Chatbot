import React from 'react'
import { BarChart3, Database, Zap, MessageSquare } from 'lucide-react'

interface Props { onAsk: (q: string) => void }

const EXAMPLES = [
  { icon:'📊', q:'What are the top 5 products by total sales?' },
  { icon:'💰', q:'Show total profit by product category' },
  { icon:'🗺️', q:'Which region generates the highest revenue?' },
  { icon:'📈', q:'Monthly sales trend throughout 2024' },
  { icon:'👥', q:'Compare sales by customer segment (Consumer, Corporate, Home Office)' },
  { icon:'🏆', q:'Who are the top 10 customers by revenue?' },
]

export default function WelcomeScreen({ onAsk }: Props) {
  return (
    <div style={s.wrap}>
      <div style={s.center}>
        <div style={s.icon}>◈</div>
        <h1 style={s.title}>Sales AI Assistant</h1>
        <p style={s.sub}>
          Ask questions about your sales data in plain English.<br/>
          I'll convert them to SQL, query the database, and explain the results.
        </p>

        {/* How it works */}
        <div style={s.flow}>
          {[
            {icon:<MessageSquare size={16}/>, label:'Your question'},
            {icon:'→', label:''},
            {icon:<Database size={16}/>, label:'SQL + DB'},
            {icon:'→', label:''},
            {icon:<Zap size={16}/>, label:'AI answer'},
          ].map((step, i) => (
            <div key={i} style={step.label ? s.flowStep : s.flowArrow}>
              <div style={s.flowIcon}>{step.icon}</div>
              {step.label && <span style={s.flowLabel}>{step.label}</span>}
            </div>
          ))}
        </div>

        {/* Example questions */}
        <div style={s.examplesLabel}>Example questions</div>
        <div style={s.grid}>
          {EXAMPLES.map(ex => (
            <button key={ex.q} style={s.card} onClick={() => onAsk(ex.q)}>
              <span style={s.cardIcon}>{ex.icon}</span>
              <span style={s.cardText}>{ex.q}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap:    { flex:1, overflowY:'auto', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' },
  center:  { maxWidth:720, width:'100%', textAlign:'center' as const },
  icon:    {
    width:56, height:56, background:'linear-gradient(135deg,var(--blue),var(--indigo))',
    borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:28, color:'#fff', margin:'0 auto 20px', boxShadow:'0 8px 24px rgba(99,102,241,.35)',
  },
  title:   { fontFamily:'var(--font-d)', fontSize:34, fontWeight:400, color:'var(--text)', marginBottom:12 },
  sub:     { fontSize:15, color:'var(--text2)', lineHeight:1.7, marginBottom:32 },
  flow: {
    display:'flex', alignItems:'center', justifyContent:'center',
    gap:12, marginBottom:36,
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:100, padding:'12px 24px', width:'fit-content', margin:'0 auto 36px',
  },
  flowStep:  { display:'flex', flexDirection:'column' as const, alignItems:'center', gap:4 },
  flowArrow: { color:'var(--text3)', fontSize:16 },
  flowIcon:  { color:'var(--blue)', fontSize:12 },
  flowLabel: { fontSize:10, color:'var(--text3)', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'.06em', whiteSpace:'nowrap' as const },
  examplesLabel: {
    fontSize:11, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'.1em',
    color:'var(--text3)', marginBottom:14,
  },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  card: {
    background:'var(--surface)', border:'1px solid var(--border2)',
    borderRadius:12, padding:'14px 16px', cursor:'pointer',
    textAlign:'left' as const, display:'flex', alignItems:'flex-start', gap:10,
    transition:'all .2s',
  },
  cardIcon: { fontSize:18, flexShrink:0, marginTop:1 },
  cardText: { fontSize:13, color:'var(--text2)', lineHeight:1.5 },
}
