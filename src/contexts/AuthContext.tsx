/* eslint-disable react-refresh/only-export-components */
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase'
import { getUserProfile } from '../services/firestore'
import type { AppUser } from '../types/domain'

type AuthContextValue = {
  firebaseUser: User | null
  profile: AppUser | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(Boolean(auth))

  const refreshProfile = async () => {
    if (!auth || !auth.currentUser) {
      setProfile(null)
      return
    }
    const nextProfile = await getUserProfile(auth.currentUser.uid)
    setProfile(nextProfile)
  }

  useEffect(() => {
    if (!auth) {
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        const nextProfile = await getUserProfile(user.uid)
        setProfile(nextProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    if (!auth || !isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Check .env values.')
    }
    googleProvider.setCustomParameters({ prompt: 'select_account' })
    await signInWithPopup(auth, googleProvider)
  }

  const signOutUser = async () => {
    if (!auth) return
    await signOut(auth)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      loading,
      refreshProfile,
      signInWithGoogle,
      signOutUser,
    }),
    [firebaseUser, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
