import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp, signIn } from '../lib/supabase'
import styles from './Auth.module.css'

function AuthForm({ mode }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isSignup = mode === 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignup) {
        await signUp(email, password, name)
        navigate('/app')
      } else {
        await signIn(email, password)
        navigate('/app')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}>ORT<span>US</span></Link>
        <p className={styles.sub}>{isSignup ? 'Create your account' : 'Welcome back'}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isSignup && (
            <div className={styles.field}>
              <label>Full name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password"
              placeholder={isSignup ? 'Min. 8 characters' : 'Your password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={isSignup ? 8 : undefined}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={`btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isSignup ? 'Start Free Trial' : 'Sign In'}
          </button>
        </form>

        <p className={styles.switch}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <Link to={isSignup ? '/login' : '/signup'}>
            {isSignup ? 'Sign in' : 'Start free trial'}
          </Link>
        </p>

        {isSignup && (
          <p className={styles.note}>3 free prompts included · No credit card required</p>
        )}
      </div>
    </div>
  )
}

export function SignupPage() { return <AuthForm mode="signup" /> }
export function LoginPage() { return <AuthForm mode="login" /> }
