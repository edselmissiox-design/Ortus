import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { generatePrompt, resetConversation } from '../lib/ai'
import { savePrompt, getPromptHistory, signOut, updatePromptsUsed } from '../lib/supabase'
import Paywall from '../components/Paywall'
import styles from './App.module.css'

const BIZ_CATS = ['Business Plan', 'Financial Model', 'Marketing Campaign', 'Investor Pitch', 'SOP & Process', 'Market Research', 'Growth Strategy']
const BRAND_CATS = ['Brand Identity', 'Logo Design', 'Social Content', 'Ad Copy', 'Brand Voice', 'Visual Direction', 'Launch Strategy', 'Email Campaign']
const BUILDER_CATS = ['Landing Page', 'Business Website', 'Portfolio', 'E-commerce', 'App UI', 'Dashboard', 'Full Stack App']
const KNOWLEDGE_CATS = ['Universe & Space', 'Science & Physics', 'History & Philosophy', 'Technology & AI', 'Business & Economy', 'Mathematics', 'Health & Biology']

const MODE_CONFIG = {
  biz: { label: 'Business', icon: '📊', placeholder: 'e.g. Build me an investor pitch for a fragrance brand raising £500k...' },
  brand: { label: 'Brand', icon: '✦', placeholder: 'e.g. Create a complete brand identity for a luxury streetwear label...' },
  builder: { label: 'Builder', icon: '🏗️', placeholder: 'e.g. Build me a stunning landing page for a fragrance brand called Missiox...' },
  knowledge: { label: 'Knowledge', icon: '🌍', placeholder: 'e.g. Explain how the universe was created and what existed before the Big Bang...' }
}

export default function AppPage() {
  const { user, isPro, canGenerate, refreshPlan } = useAuth()
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
  const [history, setHistory] = useState([])
  const [promptsUsed, setPromptsUsed] = useState(0)
  const chatRef = useRef(null)

  const freeLimit = 3
  const isFreeLimitReached = !isPro && promptsUsed >= freeLimit

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    addMessage('ai', 'Welcome to Ortus. Four powerful AI modes: Business, Brand, Builder and Knowledge. What would you like to create today?')
  }, [user])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const getStyle = (prefix, m) => {
    const map = { biz: 'Biz', brand: 'Brand', builder: 'Builder', knowledge: 'Knowledge' }
    return styles[prefix + (map[m] || 'Biz')] || ''
  }

  const extractCode = (text) => {
    if (!text) return null
    const patterns = [
      /```html\n?([\s\S]*?)```/i,
      /```\n?(<!DOCTYPE[\s\S]*?)```/i,
      /(<!DOCTYPE html>[\s\S]*?<\/html>)/i,
      /(<html[\s\S]*?<\/html>)/i
    ]
    for (let i = 0; i < patterns.length; i++) {
      const match = text.match(patterns[i])
      if (match) {
        const code = match[1] || match[0]
        if (code && code.length > 100) return code.trim()
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
      biz: '📊 Business Mode activated.',
      brand: '✦ Brand Mode activated.',
      builder: '🏗️ Builder Mode activated. Describe what you want built.',
      knowledge: '🌍 Knowledge Mode activated. Ask me anything.'
    }
    addMessage('ai', msgs[m])
  }

  const handleCatChange = (cat) => {
    setActiveCat(cat)
    resetConversation()
  }

  const addMessage = (who, text, isPrompt, cat, output) => {
    const newMsg = {
      who: who,
      text: text || '',
      isPrompt: isPrompt === true,
      cat: cat || '',
      output: output || '',
      id: Date.now() + Math.random()
    }
    setMessages(prev => [...prev, newMsg])
  }

  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || loading) return

    if (isFreeLimitReached) {
      setShowPaywall(true)
      addMessage('ai', 'You have used all 3 free prompts. Upgrade to Ortus Pro for unlimited access.', false, '', '')
      return
    }

    setInput('')
    addMessage('user', msg, false, '', '')
    setLoading(true)

    try {
      addMessage('ai', mode === 'builder' ? '🏗️ Building your website...' : '⏳ Generating...', false, '', '')
      const result = await generatePrompt(msg, mode, activeCat)

      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          text: 'Here is your ' + activeCat + ':'
        }
        return copy
      })

      addMessage('ai', result, true, activeCat, result)

      if (user) {
        await savePrompt(user.id, msg, result, mode, activeCat).catch(() => {})
        const newUsed = promptsUsed + 1
        setPromptsUsed(newUsed)
        await updatePromptsUsed(user.id, newUsed).catch(() => {})
        refreshPlan()

        if (!isPro && newUsed >= freeLimit) {
          setTimeout(() => {
            addMessage('ai', 'You have used all 3 free prompts. Upgrade to Ortus Pro for unlimited access.', false, '', '')
            setShowPaywall(true)
          }, 1000)
        }
      }
    } catch (err) {
      addMessage('ai', 'Error: ' + err.message, false, '', '')
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = (code) => {
    if (!code || code.trim() === '') {
      addMessage('ai', 'No code to download. Please generate a website first.', false, '', '')
      return
    }
    try {
      const blob = new Blob([code], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ortus-website.html'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addMessage('ai', '✅ Website downloaded! Double click the file to preview it, or drag it to netlify.com/drop to make it live!', false, '', '')
    } catch (err) {
      addMessage('ai', 'Download failed: ' + err.message, false, '', '')
    }
  }

  const loadHistory = async () => {
    if (!user) return
    const h = await getPromptHistory(user.id).catch(() => [])
    setHistory(h || [])
    setShowHistory(true)
  }

  const copyToClipboard = (text) => {
    if (!text) return
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      addMessage('ai', '✅ Copied to clipboard!', false, '', '')
    } catch (err) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const cats = mode === 'biz' ? BIZ_CATS : mode === 'brand' ? BRAND_CATS : mode === 'builder' ? BUILDER_CATS : KNOWLEDGE_CATS
  const freeLeft = Math.max(0, freeLimit - promptsUsed)

  return (
    <div className={styles.app}>
      <div className={styles.topbar}>
        <div className={styles.logo}>ORT<span>US</span></div>
        <div className={styles.modeToggle}>
          {Object.keys(MODE_CONFIG).map(m => (
            <button
              key={m}
              className={styles.modeBtn + ' ' + getStyle('mode', m) + (mode === m ? ' ' + styles.modeActive : '')}
              onClick={() => switchMode(m)}
            >{MODE_CONFIG[m].label}</button>
          ))}
        </div>
        <div className={styles.topRight}>
          <button className={styles.iconBtn} onClick={loadHistory}>⊙</button>
          <button className={styles.iconBtn} onClick={handleSignOut}>↩</button>
        </div>
      </div>

      {!isPro && (
        <div className={styles.trialBar}>
          <span>{freeLeft > 0 ? '✦ ' + freeLeft + ' free prompt' + (freeLeft !== 1 ? 's' : '') + ' remaining' : '✦ Free trial ended — upgrade to continue'}</span>
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
              {msg.who === 'user' ? 'U' : 'O'}
            </div>
            <div className={styles.msgBody}>
              <div className={styles.msgName + (msg.who !== 'user' ? ' ' + getStyle('name', mode) : '')}>
                {msg.who === 'user' ? 'You' : 'Ortus · ' + MODE_CONFIG[mode].label}
              </div>
              {msg.isPrompt ? (
                <div className={styles.outputCard + ' ' + getStyle('output', mode)}>
                  <div className={styles.outputLabel + ' ' + getStyle('label', mode)}>
                    {MODE_CONFIG[mode].icon} {msg.cat}
                  </div>
                  <div className={styles.outputText}>{msg.output}</div>
                  <div className={styles.outputActions}>
                    <span className={styles.outputType}>Ortus · {MODE_CONFIG[mode].label}</span>
                    <div className={styles.actionBtns}>
                      <button
                        className={styles.actBtn + ' ' + getStyle('act', mode)}
                        onClick={() => copyToClipboard(msg.output)}
                      >Copy</button>
                      {mode === 'builder' && (
                        <button
                          className={styles.actBtn + ' ' + styles.actBuilder}
                          onClick={() => {
                            const code = extractCode(msg.output) || msg.output
                            setPreviewCode(code)
                            setShowPreview(true)
                          }}
                        >Preview</button>
                      )}
                      {mode === 'builder' && (
                        <button
                          className={styles.actBtn + ' ' + styles.actBuilder}
                          onClick={() => handleDeploy(extractCode(msg.output) || msg.output)}
                        >⬇ Download</button>
                      )}
                      <button
                        className={styles.actBtn + ' ' + getStyle('act', mode)}
                        onClick={() => setInput('Refine this with more depth and detail')}
                      >Refine</button>
                    </div>
                  </div>
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
            placeholder={MODE_CONFIG[mode].placeholder}
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
              <button className={styles.actBtn + ' ' + styles.actBuilder} onClick={() => handleDeploy(previewCode)}>⬇ Download</button>
              <button className={styles.closeBtn} onClick={() => setShowPreview(false)}>✕ Close</button>
            </div>
          </div>
          <iframe
            srcDoc={previewCode}
            className={styles.previewFrame}
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{width:'100%', height:'100%', minHeight:'600px', border:'none', background:'white', display:'block', flex:1}}
          />
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
                <div className={styles.historyMode + ' ' + getStyle('label', h.mode)}>{MODE_CONFIG[h.mode] ? MODE_CONFIG[h.mode].icon : ''} {h.category}</div>
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
