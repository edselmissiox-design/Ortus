import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { generatePrompt, resetConversation } from '../lib/ai'
import { savePrompt, getPromptHistory, signOut, updatePromptsUsed } from '../lib/supabase'
import Paywall from '../components/Paywall'
import styles from './App.module.css'

const BIZ_CATS = ['Business Plan', 'Financial Model', 'Marketing Campaign', 'Investor Pitch', 'SOP & Process', 'Market Research', 'Growth Strategy']
const BRAND_CATS = ['Brand Identity', 'Social Content', 'Ad Copy', 'Brand Voice', 'Visual Direction', 'Launch Strategy', 'Email Campaign']
const BUILDER_CATS = ['Landing Page', 'Business Website', 'Portfolio', 'E-commerce', 'App UI', 'Dashboard', 'Full Stack App']
const KNOWLEDGE_CATS = ['Universe & Space', 'Science & Physics', 'History & Philosophy', 'Technology & AI', 'Business & Economy', 'Mathematics', 'Health & Biology']

const MODE_CONFIG = {
  biz: { label: 'Business', icon: '📊', color: 'Biz', placeholder: 'e.g. Build me an investor pitch for a fragrance brand raising £500k...' },
  brand: { label: 'Brand', icon: '✦', color: 'Brand', placeholder: 'e.g. Create a complete brand identity for a luxury streetwear label...' },
  builder: { label: 'Builder', icon: '🏗️', color: 'Builder', placeholder: 'e.g. Build me a stunning landing page for a fragrance brand called Missiox...' },
  knowledge: { label: 'Knowledge', icon: '🌍', color: 'Knowledge', placeholder: 'e.g. Explain how the universe was created and what existed before the Big Bang...' }
}

export default function AppPage() {
  const { user, isPro, trialLeft, canGenerate, refreshPlan } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('biz')
  const [activeCat, setActiveCat] = useState('Business Plan')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewCode, setPreviewCode] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [history, setHistory] = useState([])
  const [promptsUsed, setPromptsUsed] = useState(0)
  const chatRef = useRef(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    addMessage('ai', `Welcome to Ortus${user?.user_metadata?.full_name ? ', ' + user.user_metadata.full_name.split(' ')[0] : ''}. I am your super intelligent AI platform. Four powerful modes: Business, Brand, Builder and Knowledge. What would you like to create today?`)
  }, [user])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const c = (name) => styles[name] || ''

  const getStyle = (prefix, m) => {
    const map = { biz: 'Biz', brand: 'Brand', builder: 'Builder', knowledge: 'Knowledge' }
    return c(prefix + (map[m] || 'Biz'))
  }

  const extractCode = (text) => {
    const patterns = [
      /```html\n?([\s\S]*?)```/i,
      /```\n?(<!DOCTYPE[\s\S]*?)```/i,
      /(<!DOCTYPE html>[\s\S]*?<\/html>)/i,
      /```\n?([\s\S]*?<\/html>[\s\S]*?)```/i
    ]
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const code = match[1] || match[0]
        if (code && (code.includes('<html') || code.includes('<!DOCTYPE'))) return code.trim()
      }
    }
    return null
  }

  const switchMode = (m) => {
    setMode(m)
    resetConversation()
    const cats = { biz: 'Business Plan', brand: 'Brand Identity', builder: 'Landing Page', knowledge: 'Universe & Space' }
    setActiveCat(cats[m])
    const msgs = {
      biz: '📊 Business Mode activated. Analytical, strategic, structured. I will build you world-class business frameworks, investor pitches and growth strategies.',
      brand: '✦ Brand Mode activated. Creative, visual, expressive. I will craft distinctive brand identities, campaigns and creative strategies.',
      builder: '🏗️ Builder Mode activated. I will generate complete, stunning, deployable websites and apps. Describe what you want built.',
      knowledge: '🌍 Knowledge Mode activated. Deep research on any topic. Ask me anything — from the origin of the universe to the future of AI.'
    }
    addMessage('ai', msgs[m])
  }

  const handleCatChange = (cat) => {
    setActiveCat(cat)
    resetConversation()
    addMessage('ai', `${MODE_CONFIG[mode].icon} Ready to work on ${cat}. Tell me what you need.`)
  }

  const addMessage = (who, text, isPrompt, cat, output) => {
    setMessages(prev => [...prev, {
      who, text: text || '', isPrompt: isPrompt || false,
      cat: cat || '', output: output || '', id: Date.now() + Math.random()
    }])
  }

  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    if (!canGenerate) { setShowPaywall(true); return }

    setInput('')
    addMessage('user', msg)
    setLoading(true)

    try {
      const loadingMsgs = {
        biz: '📊 Analysing and constructing your framework...',
        brand: '✦ Crafting your brand strategy...',
        builder: '🏗️ Building your website — this may take a moment...',
        knowledge: '🌍 Researching deeply across all fields of knowledge...'
      }
      addMessage('ai', loadingMsgs[mode])
      const result = await generatePrompt(msg, mode, activeCat)

      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { ...copy[copy.length - 1], text: `${MODE_CONFIG[mode].icon} Here is your ${activeCat}:` }
        return copy
      })

      addMessage('ai', result, true, activeCat, result)

      if (user) {
        await savePrompt(user.id, msg, result, mode, activeCat).catch(() => {})
        const newUsed = promptsUsed + 1
        setPromptsUsed(newUsed)
        await updatePromptsUsed(user.id, newUsed).catch(() => {})
        refreshPlan()
      }

      if (!isPro && trialLeft - 1 <= 0) {
        setTimeout(() => {
          addMessage('ai', 'You have used all your free prompts. Upgrade to Ortus Pro for unlimited access to all modes.')
          setShowPaywall(true)
        }, 1000)
      }
    } catch (err) {
      addMessage('ai', '⚠️ Error: ' + err.message + '. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async (code) => {
    setDeploying(true)
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlCode: code,
          siteName: 'ortus-' + Date.now()
        })
      })
      const data = await response.json()
      if (data.url) {
        setPreviewUrl(data.url)
        addMessage('ai', `🚀 Your website is LIVE at: ${data.url} — Click the link to see it!`)
      } else {
        throw new Error(data.error || 'Deploy failed')
      }
    } catch (err) {
      addMessage('ai', '⚠️ Deploy failed: ' + err.message + '. You can still copy the code and deploy manually on netlify.com')
    } finally {
      setDeploying(false)
    }
  }

  const loadHistory = async () => {
    if (!user) return
    const h = await getPromptHistory(user.id).catch(() => [])
    setHistory(h || [])
    setShowHistory(true)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const cats = mode === 'biz' ? BIZ_CATS : mode === 'brand' ? BRAND_CATS : mode === 'builder' ? BUILDER_CATS : KNOWLEDGE_CATS
  const freeLeft = Math.max(0, 3 - promptsUsed)

  return (
    <div className={styles.app}>
      <div className={styles.topbar}>
        <div className={styles.logo}>ORT<span>US</span></div>
        <div className={styles.modeToggle}>
          {Object.entries(MODE_CONFIG).map(([m, cfg]) => (
            <button
              key={m}
              className={styles.modeBtn + ' ' + getStyle('mode', m) + (mode === m ? ' ' + styles.modeActive : '')}
              onClick={() => switchMode(m)}
            >{cfg.label}</button>
          ))}
        </div>
        <div className={styles.topRight}>
          <button className={styles.iconBtn} onClick={loadHistory} title="History">⊙</button>
          <button className={styles.iconBtn} onClick={handleSignOut} title="Sign out">↩</button>
        </div>
      </div>

      {!isPro && (
        <div className={styles.trialBar}>
          <span>{freeLeft > 0 ? `✦ ${freeLeft} free prompt${freeLeft !== 1 ? 's' : ''} remaining` : '✦ Free trial ended'}</span>
          <button onClick={() => setShowPaywall(true)}>UPGRADE TO PRO</button>
        </div>
      )}
      {isPro && (
        <div className={styles.trialBar + ' ' + styles.proBanner}>
          <span>✦ Ortus Pro — Unlimited · Business · Brand · Builder · Knowledge</span>
        </div>
      )}

      <div className={styles.cats}>
        {cats.map(cat => (
          <button
            key={cat}
            className={styles.cat + (activeCat === cat ? ' ' + getStyle('catActive', mode) : '')}
            onClick={() => handleCatChange(cat)}
          >{cat}</button>
        ))}
      </div>

      <div className={styles.chat} ref={chatRef}>
        {messages.map(msg => (
          <div key={msg.id} className={styles.msg + (msg.who === 'user' ? ' ' + styles.userMsg : '')}>
            <div className={styles.avatar + ' ' + (msg.who === 'user' ? styles.avatarUser : getStyle('avatar', mode))}>
              {msg.who === 'user' ? (user?.user_metadata?.full_name?.[0] ?? 'U') : 'O'}
            </div>
            <div className={styles.msgBody}>
              <div className={styles.msgName + (msg.who !== 'user' ? ' ' + getStyle('name', mode) : '')}>
                {msg.who === 'user' ? 'You' : `Ortus · ${MODE_CONFIG[mode]?.label}`}
              </div>
              {msg.isPrompt ? (
                <div className={styles.outputCard + ' ' + getStyle('output', mode)}>
                  <div className={styles.outputLabel + ' ' + getStyle('label', mode)}>
                    {MODE_CONFIG[mode]?.icon} {msg.cat}
                  </div>
                  <div className={styles.outputText}>{msg.output}</div>
                  <div className={styles.outputActions}>
                    <span className={styles.outputType}>Ortus · {MODE_CONFIG[mode]?.label}</span>
                    <div className={styles.actionBtns}>
                      <button className={styles.actBtn + ' ' + getStyle('act', mode)} onClick={() => copyToClipboard(msg.output)}>Copy</button>
                      {mode === 'builder' && extractCode(msg.output) && (
                        <>
                          <button
                            className={styles.actBtn + ' ' + styles.actBuilder}
                            onClick={() => { setPreviewCode(extractCode(msg.output)); setShowPreview(true) }}
                          >Preview</button>
                          <button
                            className={styles.actBtn + ' ' + styles.actBuilder}
                            onClick={() => handleDeploy(extractCode(msg.output))}
                            disabled={deploying}
                          >{deploying ? 'Deploying...' : '🚀 Deploy'}</button>
                        </>
                      )}
                      <button
                        className={styles.actBtn + ' ' + getStyle('act', mode)}
                        onClick={() => setInput('Refine this further — make it more detailed, more powerful and more complete')}
                      >Refine</button>
                    </div>
                  </div>
                  {previewUrl && mode === 'builder' && (
                    <div className={styles.liveUrl}>
                      🌐 Live: <a href={previewUrl} target="_blank" rel="noreferrer">{previewUrl}</a>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.bubble}>{msg.text}</div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className={styles.msg}>
            <div className={styles.avatar + ' ' + getStyle('avatar', mode)}>O</div>
            <div className={styles.msgBody}>
              <div className={styles.typing + ' ' + getStyle('typing', mode)}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputRow}>
          <textarea
            className={styles.inputBox + ' ' + getStyle('input', mode)}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={MODE_CONFIG[mode]?.placeholder}
            rows={1}
          />
          <button
            className={styles.sendBtn + ' ' + getStyle('send', mode)}
            onClick={handleSend}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {showPreview && (
        <div className={styles.previewOverlay}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>🏗️ Live Preview</span>
            <div className={styles.previewActions}>
              <button className={styles.actBtn + ' ' + styles.actBuilder} onClick={() => copyToClipboard(previewCode)}>Copy Code</button>
              <button
                className={styles.actBtn + ' ' + styles.actBuilder}
                onClick={() => handleDeploy(previewCode)}
                disabled={deploying}
              >{deploying ? 'Deploying...' : '🚀 Deploy Live'}</button>
              <button className={styles.closeBtn} onClick={() => setShowPreview(false)}>✕ Close</button>
            </div>
          </div>
          <iframe srcDoc={previewCode} className={styles.previewFrame} title="Preview" sandbox="allow-scripts" />
        </div>
      )}

      {showHistory && (
        <div className={styles.drawer}>
          <div className={styles.drawerHead}>
            <span className="label">History</span>
            <button className={styles.closeBtn} onClick={() => setShowHistory(false)}>✕</button>
          </div>
          <div className={styles.drawerList}>
            {history.length === 0 && <p className={styles.emptyNote}>No history yet.</p>}
            {history.map(h => (
              <div key={h.id} className={styles.historyItem} onClick={() => { setInput(h.prompt); setShowHistory(false) }}>
                <div className={styles.historyMode + ' ' + getStyle('label', h.mode)}>{MODE_CONFIG[h.mode]?.icon} {h.category}</div>
                <div className={styles.historyPrompt}>{h.prompt}</div>
                <div className={styles.historyDate}>{new Date(h.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} onSuccess={refreshPlan} />}
    </div>
  )
}
