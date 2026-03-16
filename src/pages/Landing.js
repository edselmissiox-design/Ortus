import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Landing.module.css'

export default function Landing() {
  const navigate = useNavigate()
  const [hoveredMode, setHoveredMode] = useState(null)

  return (
    <div className={styles.page}>
      <div className={styles.rings}>
        <div className={styles.ring} />
        <div className={styles.ring} />
        <div className={styles.ring} />
      </div>

      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <div className={styles.logo}>ORT<span>US</span></div>
          <div className={styles.logoSub}>AI Prompt Builder</div>
        </div>

        <div className={styles.divider} />

        <h1 className={styles.headline}>
          Build any business.<br />
          <em>Express any brand.</em>
        </h1>
        <p className={styles.desc}>
          Two intelligent modes. One powerful ecosystem.<br />
          Generate strategic prompts and brand content — in seconds.
        </p>

        <div className={styles.modes}>
          <div
            className={`${styles.mode} ${styles.modeBiz} ${hoveredMode === 'biz' ? styles.modeActive : ''}`}
            onMouseEnter={() => setHoveredMode('biz')}
            onMouseLeave={() => setHoveredMode(null)}
          >
            <div className={styles.modeIcon}>📊</div>
            <div className={styles.modeName}>Business</div>
            <div className={styles.modeTag}>Analytical · Strategic · Structured</div>
            <ul className={styles.modeList}>
              <li>Business Plans</li>
              <li>Financial Models</li>
              <li>Investor Pitches</li>
              <li>Marketing Campaigns</li>
              <li>SOPs & Processes</li>
            </ul>
          </div>
          <div
            className={`${styles.mode} ${styles.modeBrand} ${hoveredMode === 'brand' ? styles.modeActive : ''}`}
            onMouseEnter={() => setHoveredMode('brand')}
            onMouseLeave={() => setHoveredMode(null)}
          >
            <div className={styles.modeIcon}>✦</div>
            <div className={styles.modeName}>Brand</div>
            <div className={styles.modeTag}>Creative · Visual · Expressive</div>
            <ul className={styles.modeList}>
              <li>Brand Identities</li>
              <li>Social Content</li>
              <li>Ad Copy</li>
              <li>Visual Direction</li>
              <li>Launch Strategies</li>
            </ul>
          </div>
        </div>

        <div className={styles.ctas}>
          <button className={`btn-primary ${styles.ctaMain}`} onClick={() => navigate('/signup')}>
            Start Free Trial
          </button>
          <button className={`btn-ghost ${styles.ctaGhost}`} onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>

        <p className={styles.trialNote}>3 free prompts · No credit card required</p>
      </div>
    </div>
  )
}
