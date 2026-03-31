import React, { useRef, useEffect } from 'react'
import { useChat } from '../hooks/useChat'
import MessageBubble from './MessageBubble'
import ThinkingBar from './ThinkingBar'
import ChatInput from './ChatInput'
import WelcomeScreen from './WelcomeScreen'

interface Props {
  sessionId:       string | null
  onSessionChange: (sid: string) => void
}

export default function ChatPage({ sessionId, onSessionChange }: Props) {
  const {
    messages, loading, thinkStep, sqlPreview,
    sendMessage, clearMessages, loadSession,
    sessionId: activeSessionId,
  } = useChat()

  const bottomRef = useRef<HTMLDivElement>(null)

  // Load session when switching
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    } else {
      clearMessages()
    }
  }, [sessionId])

  // Bubble new session id up
  useEffect(() => {
    if (activeSessionId && activeSessionId !== sessionId) {
      onSessionChange(activeSessionId)
    }
  }, [activeSessionId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = (q: string) => sendMessage(q)

  return (
    <div style={s.page}>
      {/* Messages area */}
      <div style={s.messages}>
        {messages.length === 0 && !loading ? (
          <WelcomeScreen onAsk={handleSend} />
        ) : (
          <div style={s.msgList}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {loading && (
              <ThinkingBar step={thinkStep} sqlPreview={sqlPreview} />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    display:       'flex',
    flexDirection: 'column',
    height:        '100vh',
    overflow:      'hidden',
  },
  messages: {
    flex:      1,
    overflowY: 'auto',
    display:   'flex',
    flexDirection: 'column',
  },
  msgList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           20,
    padding:       '28px 32px 16px',
    maxWidth:      860,
    width:         '100%',
    margin:        '0 auto',
  },
}
