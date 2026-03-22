import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import styles from './Paywall.module.css'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '£9',
    period: '/mo',
    priceId: process.env.REACT_APP_STRIPE_STARTER_PRICE,
    features: ['50 prompts/month', 'All 4 AI modes', 'Prompt history', 'Email support'],
    highlight: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '£21',
    period: '/mo',
    priceId: process.env.REACT_APP_STRIPE_PRO_PRICE,
    features: ['Unlimited prompts', 'All 4 AI modes', 'Priority AI', 'Full history', 'Advanced features'],
    highlight: true,
    badge: 'Most Popular'
  },
  {
    id: 'team',
    name: 'Team',
    price: '£56',
    period: '/mo',
    priceId: process.env.REACT_APP_STRIPE_TEAM_PRICE,
    features: ['5 team seats', 'Unlimited prompts', 'All 4 AI modes', 'Shared library', 'Priority support'],
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
      const response = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          email: user.email,
          userId: user.id
        })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      setError(err.message)
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
          <p className={styles.sub}>Your free trial has ended. Choose a plan to keep building.</p>
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
          {loading ? 'Redirecting to checkout...' : `Start ${PLANS.find(p => p.id === selected)?.name} — ${PLANS.find(p => p.id === selected)?.price}/mo`}
        </button>

        <p className={styles.note}>Cancel anytime · Secure payment via Stripe · 🔒</p>
      </div>
    </div>
  )
}
