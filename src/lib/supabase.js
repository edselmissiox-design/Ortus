import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

export const signUp = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  })
  if (error) throw error
  return data
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const savePrompt = async (userId, prompt, output, mode, category) => {
  const { data, error } = await supabase
    .from('prompt_history')
    .insert([{ user_id: userId, prompt, output, mode, category, created_at: new Date() }])
    .select()
  if (error) throw error
  return data
}

export const getPromptHistory = async (userId) => {
  const { data, error } = await supabase
    .from('prompt_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export const getUserPlan = async (userId) => {
  const { data, error } = await supabase
    .from('user_plans')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) return { plan: 'free', prompts_used: 0, prompts_limit: 3 }
  return data
}

export const updatePromptsUsed = async (userId, count) => {
  await supabase
    .from('user_plans')
    .upsert({ user_id: userId, prompts_used: count, updated_at: new Date() })
}
