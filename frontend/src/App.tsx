import { useState } from 'react'
import AuthPage from './components/AuthPage'
import ChatPage from './components/ChatPage'
import Sidebar from './components/Sidebar'
import { useAuthStore } from './store/authStore'

export default function App() {
  const { isAuth } = useAuthStore()
  const [sessionId, setSessionId] = useState<string | null>(null)

  if (!isAuth) return <AuthPage />

  const handleNewSession = () => setSessionId(null)
  const handleDelete = (sid: string) => {
    if (sid === sessionId) setSessionId(null)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        currentSessionId={sessionId}
        onSelectSession={setSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDelete}
      />
      <div style={{ marginLeft: 260, flex: 1, minWidth: 0 }}>
        <ChatPage
          sessionId={sessionId}
          onSessionChange={setSessionId}
        />
      </div>
    </div>
  )
}
