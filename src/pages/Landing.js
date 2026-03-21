import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Landing.module.css'

function OrtusLogoMark({ size = 100 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <style>{`
        @keyframes pulse1 { 0%,100%{opacity:.15;} 50%{opacity:.05;} }
        @keyframes pulse2 { 0%,100%{opacity:.1;} 50%{opacity:.03;} }
        @keyframes pulse3 { 0%,100%{opacity:.06;} 50%{opacity:.02;} }
        @keyframes glowDot { 0%,100%{opacity:1;} 50%{opacity:.6;} }
        @keyframes riseUp { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-3px);} }
        .ortus-mark{animation:riseUp 3s ease-in-out infinite;transform-origin:center;}
      `}</style>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#c9a84c" strokeWidth="0.5" style={{animation:'pulse1 2.5s ease-in-out infinite'}}/>
      <circle cx="50" cy="50" r="52" fill="none" stroke="#c9a84c" strokeWidth="0.4" style={{animation:'pulse2 2.5s ease-in-out infinite .4s'}}/>
      <circle cx="50" cy="50" r="66" fill="none" stroke="#c9a84c" strokeWidth="0.3" style={{animation:'pulse3 2.5s ease-in-out infinite .8s'}}/>
      <g className="ortus-mark">
        <path d="M50 88 L50 58 L32 88 Z" fill="rgba(201,168,76,0.25)" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M50 88 L50 32 L68 88 Z" fill="rgba(201,168,76,0.6)" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M50 88 L68 58 L86 88 Z" fill="rgba(201,168,76,0.25)" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="24" y1="94" x2="76" y2="94" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="50" cy="22" r="8" fill="#c9a84c" style={{animation:'glowDot 2.5s ease-in-out infinite'}}/>
      </g>
    </svg>
  )
}

const GLITCH_PHRASES = [
  'ORTVS · ORIGINEM',
  'EX NIHILO OMNIA',
  'SCIENTIA EST POTENTIA',
  'FIAT LVX',
  'AB INITIO',
  'IN PRINCIPIO',
  'VERITAS ET LVX',
  'SVRGIT ORTVS',
]

function GlitchText() {
  const [current, setCurrent] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [glitching, setGlitching] = useState(false)

  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ·ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩאבגדהוזחטיכלמנסעפצקרשת'

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true)
      const target = GLITCH_PHRASES[current]
      let iteration = 0
      const glitchInterval = setInterval(() => {
        setDisplayed(
          target.split('').map((char, i) => {
            if (char === ' ' || char === '·') return char
            if (i < iteration) return target[i]
            return CHARS[Math.floor(Math.random() * CHARS.length)]
          }).join('')
        )
        if (iteration >= target.length) {
          clearInterval(glitchInterval)
          setDisplayed(target)
          setGlitching(false)
          setCurrent(prev => (prev + 1) % GLITCH_PHRASES.length)
        }
        iteration += 1/3
      }, 40)
    }, 3000)
    return () => clearInterval(interval)
  }, [current])

  useEffect(() => {
    setDisplayed(GLITCH_PHRASES[0])
  }, [])

  return (
    <div className={styles.glitchWrap}>
      <span className={`${styles.glitchText} ${glitching ? styles.glitching : ''}`}>
        {displayed}
      </span>
    </div>
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
          <OrtusLogoMark size={100} />
          <div className={styles.logo}>ORT<span>US</span></div>
          <div className={styles.logoSub}>AI Platform</div>
        </div>

        <GlitchText />

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
              <li>Logo Design</li>
              <li>Social Content</li>
              <li>Ad Copy</li>
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
