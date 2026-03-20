import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Landing.module.css'

function OrtusLogoMark({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 88 L50 58 L32 88 Z" fill="rgba(201,168,76,0.25)" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M50 88 L50 32 L68 88 Z" fill="rgba(201,168,76,0.6)" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M50 88 L68 58 L86 88 Z" fill="rgba(201,168,76,0.25)" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="24" y1="94" x2="76" y2="94" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="50" cy="22" r="7" fill="#c9a84c"/>
    </svg>
  )
}

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
          <OrtusLogoMark size={80} />
          <div className={styles.logo}>ORT<span>US</span></div>
          <div className={styles.logoSub}>AI Platform</div>
        </div>

        <div className={styles.divider} />

        <h1 className={styles.headline}>
          Build any business.<br />
          <em>Express any brand.</em>
        </h1>

        <p className={styles.desc}>
          Four intelligent modes. One powerful ecosystem.<br />
          Business · Brand · Builder · Knowledge
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
              <li>Growth Strategies</li>
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

          <div
            className={`${styles.mode} ${styles.modeBuilder} ${hoveredMode === 'builder' ? styles.modeActive : ''}`}
            onMouseEnter={() => setHoveredMode('builder')}
            onMouseLeave={() => setHoveredMode(null)}
          >
            <div className={styles.modeIcon}>🏗️</div>
            <div className={styles.modeName}>Builder</div>
            <div className={styles.modeTag}>Build · Design · Deploy</div>
            <ul className={styles.modeList}>
              <li>Landing Pages</li>
              <li>Business Websites</li>
              <li>App Interfaces</li>
              <li>Dashboards</li>
              <li>Full Stack Apps</li>
            </ul>
          </div>

          <div
            className={`${styles.mode} ${styles.modeKnowledge} ${hoveredMode === 'knowledge' ? styles.modeActive : ''}`}
            onMouseEnter={() => setHoveredMode('knowledge')}
            onMouseLeave={() => setHoveredMode(null)}
          >
            <div className={styles.modeIcon}>🌍</div>
            <div className={styles.modeName}>Knowledge</div>
            <div className={styles.modeTag}>Research · Discover · Learn</div>
            <ul className={styles.modeList}>
              <li>Universe & Space</li>
              <li>Science & Physics</li>
              <li>History & Philosophy</li>
              <li>Technology & AI</li>
              <li>Mathematics</li>
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

        <div className={styles.footer}>
          <OrtusLogoMark size={28} />
          <span>© 2026 Ortus AI Platform</span>
        </div>

      </div>
    </div>
  )
}
