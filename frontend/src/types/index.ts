export interface User {
  user_id:   string
  email:     string
  full_name: string
  role:      string
}

export interface AuthState {
  user:          User | null
  access_token:  string | null
  refresh_token: string | null
  isAuthenticated: boolean
}

export interface Message {
  id:            string
  role:          'user' | 'assistant' | 'system'
  content:       string
  sql_generated?: string
  rows_returned?: number
  created_at?:   string
  isStreaming?:  boolean
  fromCache?:    boolean
}

export interface ChatSession {
  id:            string
  title?:        string
  created_at:    string
  updated_at:    string
  message_count: number
}

export interface SSEEvent {
  type:    'session'|'thinking'|'sql'|'data'|'result'|'error'|'cached'
  data:    Record<string, unknown>
}
