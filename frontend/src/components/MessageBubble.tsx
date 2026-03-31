import React, { useState } from 'react'
import { Message } from '../types'
import { ChevronDown, ChevronUp, Database, Zap } from 'lucide-react'

interface Props { msg: Message }

export default function MessageBubble({ msg }: Props) {
  const [showSql, setShowSql] = useState(false)
  const isUser = msg.role === 'user'

  return (
    <div style={{ display:'flex', flexDirection:'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  gap:6, animation:'fadeup .25s ease' }}>

      {/* Role label */}
      <div style={styles.roleLabel}>
        {isUser ? 'You' : '✦ Sales AI'}
        {msg.fromCache && (
          <span style={styles.cacheBadge}><Zap size={10} /> cached</span>
        )}
      </div>

      {/* Bubble */}
      <div style={{
        ...styles.bubble,
        ...(isUser ? styles.userBubble : styles.aiBubble),
      }}>
        {msg.isStreaming && !msg.content ? (
          <div style={styles.typing}>
            <span style={{...styles.dot, animationDelay:'0ms'}} />
            <span style={{...styles.dot, animationDelay:'180ms'}} />
            <span style={{...styles.dot, animationDelay:'360ms'}} />
          </div>
        ) : (
          <div style={styles.content}>{msg.content}</div>
        )}
      </div>

      {/* SQL reveal (assistant only) */}
      {!isUser && msg.sql_generated && (
        <div style={styles.sqlWrap}>
          <button style={styles.sqlToggle} onClick={() => setShowSql(p => !p)}>
            <Database size={12} />
            {msg.rows_returned != null ? `${msg.rows_returned} rows` : 'SQL'}
            {showSql ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>
          {showSql && (
            <pre style={styles.sqlBlock}>{msg.sql_generated}</pre>
          )}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  roleLabel: {
    fontSize:11, fontWeight:600, color:'var(--text3)',
    textTransform:'uppercase', letterSpacing:'.08em',
    display:'flex', alignItems:'center', gap:6,
  },
  cacheBadge: {
    display:'inline-flex', alignItems:'center', gap:3,
    background:'rgba(34,197,94,.12)', color:'var(--green)',
    padding:'1px 7px', borderRadius:100, fontSize:10,
  },
  bubble: {
    maxWidth:'78%', padding:'13px 17px',
    borderRadius:16, lineHeight:1.7, fontSize:14,
    wordBreak:'break-word', whiteSpace:'pre-wrap',
  },
  userBubble: {
    background:'var(--blue)', color:'#fff',
    borderBottomRightRadius:4,
  },
  aiBubble: {
    background:'var(--surface2)', color:'var(--text)',
    border:'1px solid var(--border2)', borderBottomLeftRadius:4,
  },
  content: { },
  typing:  { display:'flex', gap:5, alignItems:'center', padding:'2px 0' },
  dot: {
    width:7, height:7, borderRadius:'50%', background:'var(--text3)',
    animation:'pulse 1.2s ease-in-out infinite',
    display:'inline-block',
  },
  sqlWrap:   { maxWidth:'78%' },
  sqlToggle: {
    display:'inline-flex', alignItems:'center', gap:5,
    background:'none', border:'1px solid var(--border2)',
    color:'var(--text3)', fontSize:11, padding:'4px 10px',
    borderRadius:6, marginBottom:4,
  },
  sqlBlock: {
    background:'rgba(0,0,0,.4)', border:'1px solid var(--border2)',
    borderRadius:10, padding:'12px 16px',
    color:'#7dd3fc', fontSize:12, fontFamily:'monospace',
    overflowX:'auto', whiteSpace:'pre-wrap', lineHeight:1.65,
  },
}
