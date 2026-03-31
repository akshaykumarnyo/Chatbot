import { create } from 'zustand'
import { User } from '../types'

interface AuthStore {
  user:         User | null
  accessToken:  string | null
  setAuth:      (user: User, token: string) => void
  clearAuth:    () => void
  isAuth:       boolean
}

const saved = localStorage.getItem('auth')
const init  = saved ? JSON.parse(saved) : null

export const useAuthStore = create<AuthStore>((set) => ({
  user:        init?.user        ?? null,
  accessToken: init?.accessToken ?? null,
  isAuth:      !!init?.accessToken,

  setAuth: (user, accessToken) => {
    localStorage.setItem('auth', JSON.stringify({ user, accessToken }))
    set({ user, accessToken, isAuth: true })
  },

  clearAuth: () => {
    localStorage.removeItem('auth')
    set({ user: null, accessToken: null, isAuth: false })
  },
}))
