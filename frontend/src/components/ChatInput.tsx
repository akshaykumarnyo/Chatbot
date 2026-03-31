import React, { useState, useRef, KeyboardEvent } from 'react'
import { Send, Mic } from 'lucide-react'

interface Props {
  onSend:   (q: string) => void
  disabled: boolean
}

const SUGGESTIONS = [
  'What are the top 5 products by sales?',
  'Show total profit by category',
  'Which region has the highest sales?',
  'Monthly sales trend for 2024',
  'Compare sales by customer segment',
  'Top 10 customers by revenue',
]

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const [showSugg, setShowSugg] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const q = value.trim()
    if (!q || disabled) return
    onSend(q)
    setValue('')
    setShowSugg(false)
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const pick = (s: string) => { setValue(s); setShowSugg(false); ref.current?.focus() }

  return (
    <div style={styles.wrap}>
      {/* Suggestions */}
      {showSugg && !value && (
        <div style={styles.suggs}>
          <div style={styles.suggsLabel}>Try asking…</div>
          <div style={styles.suggGrid}>
            {SUGGESTIONS.map(s => (
              <button key={s} style={styles.sugg} onClick={() => pick(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={styles.bar}>
        <textarea
          ref={ref}
          style={styles.textarea}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => setShowSugg(true)}
          placeholder="Ask anything about your sales data…"
          disabled={disabled}
          rows={1}
        />
        <button
          style={{...styles.sendBtn, ...((!value.trim()||disabled) ? styles.sendDisabled:{})}}
          onClick={submit}
          disabled={!value.trim() || disabled}
        >
          <Send size={16} />
        </button>
      </div>
      <div style={styles.hint}>
        Press <kbd style={styles.kbd}>Enter</kbd> to send · <kbd style={styles.kbd}>Shift+Enter</kbd> for newline
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap:  { padding:'16px 24px 20px', borderTop:'1px solid var(--border)' },
  suggs: {
    background:'var(--surface2)', border:'1px solid var(--border2)',
    borderRadius:14, padding:'16px', marginBottom:12,
    animation:'fadeup .2s ease',
  },
  suggsLabel: { fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 },
  suggGrid:   { display:'flex', flexWrap:'wrap' as const, gap:7 },
  sugg: {
    background:'var(--surface)', border:'1px solid var(--border2)',
    borderRadius:100, padding:'6px 13px', fontSize:12, color:'var(--text2)',
    transition:'all .15s',
  },
  bar: {
    display:'flex', alignItems:'flex-end', gap:10,
    background:'var(--surface2)', border:'1px solid var(--border2)',
    borderRadius:14, padding:'10px 12px',
  },
  textarea: {
    flex:1, background:'none', border:'none', outline:'none',
    color:'var(--text)', fontSize:14, lineHeight:1.6,
    resize:'none', minHeight:24, maxHeight:160,
  },
  sendBtn: {
    width:36, height:36, borderRadius:9, background:'var(--blue)',
    border:'none', color:'#fff', display:'flex', alignItems:'center',
    justifyContent:'center', flexShrink:0, transition:'all .2s',
  },
  sendDisabled: { background:'var(--surface)', color:'var(--text3)' },
  hint: { fontSize:11, color:'var(--text3)', marginTop:8, textAlign:'center' as const },
  kbd:  {
    background:'var(--surface)', border:'1px solid var(--border2)',
    borderRadius:4, padding:'1px 5px', fontSize:10, fontFamily:'monospace',
  },
}
