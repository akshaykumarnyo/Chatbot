import { useState, useRef, useCallback } from 'react'
import { Message } from '../types'
import { chatApi }  from '../api/client'

function parseSSE(raw: string): Array<{ event: string; data: unknown }> {
  const out: Array<{ event: string; data: unknown }> = []
  const blocks = raw.split(/\n\n+/)
  for (const block of blocks) {
    const lines  = block.split('\n').filter(Boolean)
    let   event  = 'message'
    let   dataStr = ''
    for (const l of lines) {
      if (l.startsWith('event:')) event   = l.slice(6).trim()
      if (l.startsWith('data:'))  dataStr = l.slice(5).trim()
    }
    if (dataStr) {
      try { out.push({ event, data: JSON.parse(dataStr) }) }
      catch { /* skip */ }
    }
  }
  return out
}

export function useChat() {
  const [messages,   setMessages]   = useState<Message[]>([])
  const [loading,    setLoading]    = useState(false)
  const [sessionId,  setSessionId]  = useState<string | null>(null)
  const [thinkStep,  setThinkStep]  = useState<string>('')
  const [sqlPreview, setSqlPreview] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const loadSession = useCallback(async (sid: string) => {
    const msgs = await chatApi.getMessages(sid)
    setSessionId(sid)
    setMessages(msgs.map((m: any) => ({
      id:           m.id,
      role:         m.role,
      content:      m.content,
      sql_generated:m.sql_generated,
      rows_returned:m.rows_returned,
      created_at:   m.created_at,
    })))
  }, [])

  const sendMessage = useCallback(async (question: string) => {
    if (loading) return

    // Optimistically add user message
    const userMsg: Message = {
      id:      crypto.randomUUID(),
      role:    'user',
      content: question,
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setSqlPreview(null)
    setThinkStep('Connecting…')

    // Placeholder assistant message (streaming)
    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = {
      id:         assistantId,
      role:       'assistant',
      content:    '',
      isStreaming: true,
    }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const resp = await chatApi.ask(question, sessionId)
      if (!resp.ok) throw new Error('Request failed')
      if (!resp.body)  throw new Error('No response body')

      const reader  = resp.body.getReader()
      const decoder = new TextDecoder()
      let   buf     = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })

        const doubleLF = '\n\n'
        let idx: number
        while ((idx = buf.indexOf(doubleLF)) !== -1) {
          const block = buf.slice(0, idx)
          buf         = buf.slice(idx + 2)
          const parsed = parseSSE(block + '\n\n')
          for (const { event, data } of parsed) {
            const d = data as any
            if (event === 'session' && d.session_id) {
              setSessionId(d.session_id)
            }
            if (event === 'thinking') {
              setThinkStep(d.message ?? d.step ?? 'Thinking…')
            }
            if (event === 'sql' && d.sql) {
              setSqlPreview(d.sql)
            }
            if (event === 'cached') {
              setThinkStep('Cache hit ⚡')
            }
            if (event === 'result') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: d.answer ?? '', isStreaming: false,
                      sql_generated: d.sql, rows_returned: d.row_count,
                      fromCache: d.from_cache }
                  : m
              ))
              setThinkStep('')
            }
            if (event === 'error') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: `⚠ ${d.message}`, isStreaming: false }
                  : m
              ))
              setThinkStep('')
            }
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: `Connection error: ${err.message}`, isStreaming: false }
          : m
      ))
    } finally {
      setLoading(false)
      setSqlPreview(null)
      setThinkStep('')
    }
  }, [loading, sessionId])

  const clearMessages = useCallback(() => {
    setMessages([])
    setSessionId(null)
    setSqlPreview(null)
    setThinkStep('')
  }, [])

  return { messages, loading, sessionId, thinkStep, sqlPreview,
           sendMessage, clearMessages, loadSession }
}
