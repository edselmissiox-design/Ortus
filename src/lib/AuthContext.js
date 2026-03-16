import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getUserPlan } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadPlan(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadPlan(session.user.id)
      else { setPlan(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadPlan = async (userId) => {
    try {
      const userPlan = await getUserPlan(userId)
      setPlan(userPlan)
    } catch (e) {
      setPlan({ plan: 'free', prompts_used: 0, prompts_limit: 3 })
    } finally {
      setLoading(false)
    }
  }

  const refreshPlan = () => user && loadPlan(user.id)

  const isPro = plan?.plan === 'pro' || plan?.plan === 'team'
  const trialLeft = Math.max(0, (plan?.prompts_limit ?? 3) - (plan?.prompts_used ?? 0))
  const canGenerate = isPro || trialLeft > 0

  return (
    <AuthContext.Provider value={{ user, plan, loading, isPro, trialLeft, canGenerate, refreshPlan }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
