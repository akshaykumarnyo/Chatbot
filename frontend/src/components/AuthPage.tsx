import React, { useState } from 'react'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function AuthPage() {
  const { setAuth }  = useAuthStore()
  const [mode, setMode]       = useState<'login'|'register'>('login')
  const [email, setEmail]     = useState('')
  const [name,  setName]      = useState('')
  const [pass,  setPass]      = useState('')
  const [error, setError]     = useState('')
  const [busy,  setBusy]      = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      let data: any
      if (mode === 'register') {
        data = await authApi.register(email, name, pass)
      } else {
        data = await authApi.login(email, pass)
      }
      setAuth(
        { user_id: data.user_id, email: data.email,
          full_name: data.full_name, role: data.role },
        data.access_token
      )
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>◈</div>``
          <span style={styles.brandName}>Sales<em>AI</em></span>
        </div>
        <h1 style={styles.hero}>Ask anything.<br/>Get instant answers.</h1>
        <p style={styles.heroSub}>
          Natural language queries on your sales data. No SQL required.
        </p>
        <div style={styles.featureList}>
          {['Natural language to SQL automatically',
            'Gemini AI for intelligent answers',
            'Redis caching for blazing speed',
            'Full conversation history'].map(f => (
            <div key={f} style={styles.feature}>
              <span style={styles.featureDot}>✦</span> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={styles.right}>
        <div style={styles.card}>
          <div style={styles.tabs}>
            <button style={{...styles.tab, ...(mode==='login' ? styles.tabActive:{})}}
                    onClick={()=>setMode('login')}>Sign In</button>
            <button style={{...styles.tab, ...(mode==='register' ? styles.tabActive:{})}}
                    onClick={()=>setMode('register')}>Register</button>
          </div>

          <form onSubmit={submit} style={styles.form}>
            {mode === 'register' && (
              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input style={styles.input} value={name}
                  onChange={e=>setName(e.target.value)}
                  placeholder="Akshay Kumar" required />
              </div>
            )}
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} type="email" value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="you@company.com" required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input style={styles.input} type="password" value={pass}
                onChange={e=>setPass(e.target.value)}
                placeholder="••••••••" required minLength={8} />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button style={{...styles.btn, ...(busy?styles.btnDisabled:{})}}
                    type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode==='login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          {mode === 'login' && (
            <p style={styles.demo}>
              Demo: <code>demo@salesai.io</code> / <code>Password123!</code>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { display:'flex', minHeight:'100vh', background:'var(--bg)' },
  left: {
    flex:1, padding:'60px 64px',
    background:'linear-gradient(135deg,#0d1b3e 0%,#0c0f1a 100%)',
    display:'flex', flexDirection:'column', justifyContent:'center',
    borderRight:'1px solid var(--border)',
  },
  brand:     { display:'flex', alignItems:'center', gap:12, marginBottom:48 },
  brandIcon: {
    width:44, height:44, background:'var(--blue)', borderRadius:12,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:22, color:'#fff', fontWeight:700,
  },
  brandName: {
    fontFamily:'var(--font-d)', fontSize:28, fontWeight:400, color:'var(--text)',
    letterSpacing:'-.5px',
  },
  hero: {
    fontFamily:'var(--font-d)', fontSize:42, fontWeight:400,
    color:'var(--text)', lineHeight:1.2, marginBottom:16,
  },
  heroSub:  { fontSize:16, color:'var(--text2)', lineHeight:1.7, marginBottom:40 },
  featureList: { display:'flex', flexDirection:'column', gap:14 },
  feature:  { fontSize:15, color:'var(--text2)', display:'flex', alignItems:'center', gap:10 },
  featureDot: { color:'var(--blue)', fontSize:12 },
  right: {
    width:460, display:'flex', alignItems:'center', justifyContent:'center', padding:40,
  },
  card: {
    width:'100%', background:'var(--surface)',
    border:'1px solid var(--border2)', borderRadius:var_r(20),
    padding:'32px 36px', boxShadow:'var(--shadow)',
  },
  tabs: { display:'flex', gap:0, marginBottom:28, borderBottom:'1px solid var(--border)' },
  tab: {
    flex:1, padding:'10px 0', background:'none', border:'none',
    color:'var(--text3)', fontSize:14, fontWeight:500,
    borderBottom:'2px solid transparent', marginBottom:-1, transition:'all .2s',
  },
  tabActive: { color:'var(--blue)', borderBottomColor:'var(--blue)' },
  form:  { display:'flex', flexDirection:'column', gap:18 },
  field: { display:'flex', flexDirection:'column', gap:7 },
  label: { fontSize:13, fontWeight:500, color:'var(--text2)' },
  input: {
    padding:'11px 14px', background:'var(--surface2)',
    border:'1px solid var(--border2)', borderRadius:var_r(10),
    color:'var(--text)', fontSize:14, outline:'none',
    transition:'border-color .2s',
  },
  error: {
    padding:'10px 14px', background:'rgba(239,68,68,.1)',
    border:'1px solid rgba(239,68,68,.25)', borderRadius:8,
    color:'#fca5a5', fontSize:13,
  },
  btn: {
    padding:'13px', background:'var(--blue)', color:'#fff',
    border:'none', borderRadius:var_r(10), fontSize:15, fontWeight:600,
    transition:'all .2s', marginTop:4,
  },
  btnDisabled: { opacity:.5, cursor:'not-allowed' },
  demo: { marginTop:20, textAlign:'center', fontSize:12, color:'var(--text3)' },
}

function var_r(n: number) { return n }
