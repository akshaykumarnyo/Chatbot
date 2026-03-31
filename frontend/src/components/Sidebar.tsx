import { LogOut, MessageSquare, Plus, Trash2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { chatApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { ChatSession } from '../types'

interface Props {
  currentSessionId: string | null
  onSelectSession:  (sid: string) => void
  onNewSession:     () => void
  onDeleteSession:  (sid: string) => void
}

export default function Sidebar({ currentSessionId, onSelectSession, onNewSession, onDeleteSession }: Props) {
  const { user, clearAuth } = useAuthStore()
  const [sessions, setSessions] = useState<ChatSession[]>([])

  useEffect(() => {
    chatApi.getSessions().then((s: any) => setSessions(s)).catch(() => {})
  }, [currentSessionId])

  const del = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation()
    await chatApi.deleteSession(sid)
    setSessions(p => p.filter(s => s.id !== sid))
    onDeleteSession(sid)
  }

  return (
    <aside style={s.sidebar}>
      {/* Brand */}
      <div style={s.brand}>
        <div style={s.icon}>◈</div>
        <span style={s.brandTxt}>Sales<em>AI</em></span>
      </div>

      {/* New chat */}
      <button style={s.newBtn} onClick={onNewSession}>
        <Plus size={15} /> New conversation
      </button>

      {/* Sessions */}
      <div style={s.sessLabel}>Recent</div>
      <div style={s.sessionList}>
        {sessions.length === 0 && (
          <div style={s.empty}>No conversations yet</div>
        )}
        {sessions.map(sess => (
          <div key={sess.id}
               style={{...s.sessItem, ...(sess.id===currentSessionId ? s.sessActive:{})}}
               onClick={() => onSelectSession(sess.id)}>
            <MessageSquare size={13} style={{flexShrink:0, color:'var(--text3)'}} />
            <span style={s.sessTitle}>{sess.title ?? 'Untitled'}</span>
            <button style={s.delBtn} onClick={e=>del(e,sess.id)}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* User */}
      <div style={s.userRow}>
        <div style={s.avatar}>{user?.full_name?.[0]?.toUpperCase() ?? 'U'}</div>
        <div style={s.userInfo}>
          <div style={s.userName}>{user?.full_name}</div>
          <div style={s.userEmail}>{user?.email}</div>
        </div>
        <button style={s.logoutBtn} onClick={clearAuth} title="Logout">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    width:260, background:'var(--surface)', borderRight:'1px solid var(--border)',
    display:'flex', flexDirection:'column', padding:'20px 0',
    height:'100vh', position:'fixed', top:0, left:0,
  },
  brand: {
    display:'flex', alignItems:'center', gap:10, padding:'0 18px', marginBottom:20,
  },
  icon: {
    width:34, height:34, background:'var(--blue)', borderRadius:9,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:17, color:'#fff',
  },
  brandTxt: { fontFamily:'var(--font-d)', fontSize:20, color:'var(--text)' },
  newBtn: {
    margin:'0 14px 16px', padding:'10px 14px', background:'var(--surface2)',
    border:'1px dashed var(--border2)', borderRadius:10, color:'var(--text2)',
    fontSize:13, display:'flex', alignItems:'center', gap:8,
    transition:'all .2s',
  },
  sessLabel: {
    fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.1em',
    color:'var(--text3)', padding:'0 18px', marginBottom:8,
  },
  sessionList: { flex:1, overflowY:'auto', padding:'0 8px' },
  empty:       { fontSize:12, color:'var(--text3)', textAlign:'center', padding:'20px 0' },
  sessItem: {
    display:'flex', alignItems:'center', gap:8, padding:'9px 10px',
    borderRadius:8, cursor:'pointer', transition:'background .15s',
    fontSize:13, color:'var(--text2)', marginBottom:2,
  },
  sessActive: { background:'rgba(59,130,246,.12)', color:'var(--blue2)' },
  sessTitle:  { flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  delBtn: {
    background:'none', border:'none', color:'var(--text3)', padding:3,
    borderRadius:4, display:'flex', opacity:0.7,
    transition:'opacity .15s',
  },
  userRow: {
    borderTop:'1px solid var(--border)', padding:'14px 16px',
    display:'flex', alignItems:'center', gap:10,
  },
  avatar: {
    width:34, height:34, borderRadius:'50%', background:'var(--indigo)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:14, fontWeight:600, color:'#fff', flexShrink:0,
  },
  userInfo:  { flex:1, minWidth:0 },
  userName:  { fontSize:13, fontWeight:500, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  userEmail: { fontSize:11, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  logoutBtn: { background:'none', border:'none', color:'var(--text3)', padding:4, display:'flex' },
}
