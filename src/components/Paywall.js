import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import styles from './Paywall.module.css'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '£9',
    period: '/mo',
    features: ['50 prompts/month', 'Business OR Brand mode', 'Prompt history', 'Email support'],
    highlight: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '£19',
    period: '/mo',
    features: ['Unlimited prompts', 'Business + Brand modes', 'Full prompt history', 'Priority AI', 'PDF export'],
    highlight: true,
    badge: 'Most Popular'
  },
  {
    id: 'team',
    name: 'Team',
    price: '£49',
    period: '/mo',
    features: ['5 team seats', 'Unlimited prompts', 'Both modes', 'Shared prompt library', 'Priority support'],
    highlight: false
  }
]

export default function Paywall({ onClose, onSuccess }) {
  const { user } = useAuth()
  const [selected, setSelected] = useState('pro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubscribe = async () => {
    const plan = PLANS.find(p => p.id === selected)
    if (!plan || !user) return
    setLoading(true)
    setError('')

    try {
      const { error: dbError } = await supabase
        .from('user_plans')
        .upsert({
          user_id: user.id,
          plan: selected,
          prompts_used: 0,
          prompts_limit: selected === 'starter' ? 50 : 99999,
          updated_at: new Date()
        })

      if (dbError) throw dbError
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.header}>
          <div className={styles.icon}>✦</div>
          <h2 className={styles.title}>Unlock <span>Ortus</span></h2>
          <p className={styles.sub}>Your free trial has ended. Choose a plan to keep building powerful business and brand prompts.</p>
        </div>

        <div className={styles.plans}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`${styles.plan} ${plan.highlight ? styles.planFeatured : ''} ${selected === plan.id ? styles.planSelected : ''}`}
              onClick={() => setSelected(plan.id)}
            >
              {plan.badge && <div className={styles.badge}>{plan.badge}</div>}
              <div className={styles.planName}>{plan.name}</div>
              <div className={styles.planPrice}>{plan.price}<sub>{plan.period}</sub></div>
              <ul className={styles.planFeatures}>
                {plan.features.map(f => (
                  <li key={f}><span className={styles.check}>✓</span>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={`btn-primary ${styles.subscribeBtn}`}
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? 'Processing...' : `Start ${PLANS.find(p => p.id === selected)?.name} — ${PLANS.find(p => p.id === selected)?.price}/mo`}
        </button>

        <p className={styles.note}>Cancel anytime · Secure payment via Stripe</p>
      </div>
    </div>
  )
}
