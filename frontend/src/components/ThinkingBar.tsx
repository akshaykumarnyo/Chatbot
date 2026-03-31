import React from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  step:       string
  sqlPreview: string | null
}

export default function ThinkingBar({ step, sqlPreview }: Props) {
  return (
    <div style={styles.wrap}>
      <div style={styles.bar}>
        <Loader2 size={13} style={{ animation:'spin .7s linear infinite', flexShrink:0 }} />
        <span>{step || 'Thinking…'}</span>
      </div>
      {sqlPreview && (
        <div style={styles.sqlPeek}>
          <span style={styles.sqlLabel}>Generating SQL ↓</span>
          <pre style={styles.sql}>{sqlPreview.slice(0, 200)}{sqlPreview.length > 200 ? '…' : ''}</pre>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display:'flex', flexDirection:'column', gap:8, animation:'fadeup .2s ease' },
  bar:  {
    display:'inline-flex', alignItems:'center', gap:8, alignSelf:'flex-start',
    background:'var(--surface2)', border:'1px solid var(--border2)',
    borderRadius:100, padding:'7px 14px', fontSize:12, color:'var(--text2)',
  },
  sqlPeek: {
    background:'rgba(0,0,0,.35)', border:'1px solid var(--border)',
    borderRadius:10, padding:'10px 14px', maxWidth:480,
  },
  sqlLabel: { fontSize:10, color:'var(--text3)', fontWeight:600, display:'block', marginBottom:5 },
  sql: {
    color:'#7dd3fc', fontFamily:'monospace', fontSize:11.5,
    whiteSpace:'pre-wrap', lineHeight:1.6,
  },
}
