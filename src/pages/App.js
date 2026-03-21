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
  const [history, setHistory] = useState([])
  const [promptsUsed, setPromptsUsed] = useState(0)
  const chatRef = useRef(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    addMessage('ai', 'Welcome to Ortus' + (user.user_metadata && user.user_metadata.full_name ? ', ' + user.user_metadata.full_name.split(' ')[0] : '') + '. I am your super intelligent AI platform. Four powerful modes: Business, Brand, Builder and Knowledge. What would you like to create today?')
  }, [user])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const getStyle = (prefix, m) => {
    const map = { biz: 'Biz', brand: 'Brand', builder: 'Builder', knowledge: 'Knowledge' }
    return styles[prefix + (map[m] || 'Biz')] || ''
  }

  const extractCode = (text) => {
    const patterns = [
      /```html\n?([\s\S]*?)```/i,
      /```\n?(<!DOCTYPE[\s\S]*?)```/i,
      /(<!DOCTYPE html>[\s\S]*?<\/html>)/i,
      /```\n?([\s\S]*?<\/html>[\s\S]*?)```/i
    ]
    for (var i = 0; i < patterns.length; i++) {
      var match = text.match(patterns[i])
      if (match) {
        var code = match[1] || match[0]
        if (code && (code.includes('<html') || code.includes('<!DOCTYPE'))) return code.trim()
      }
    }
    return null
  }

  const switchMode = (m) => {
    setMode(m)
    resetConversation()
    var cats = { biz: 'Business Plan', brand: 'Brand Identity', builder: 'Landing Page', knowledge: 'Universe & Space' }
    setActiveCat(cats[m])
    var msgs = {
      biz: '📊 Business Mode activated. Analytical, strategic, structured.',
      brand: '✦ Brand Mode activated. Creative, visual, expressive.',
      builder: '🏗️ Builder Mode activated. I will generate complete, stunning, deployable websites and apps.',
      knowledge: '🌍 Knowledge Mode activated. Deep research on any topic in the universe.'
    }
    addMessage('ai', msgs[m])
  }

  const handleCatChange = (cat) => {
    setActiveCat(cat)
    resetConversation()
    addMessage('ai', MODE_CONFIG[mode].icon + ' Ready for ' + cat + '. Tell me what you need.')
  }

  const addMessage = (who, text, isPrompt, cat, output) => {
    setMessages(function(prev) {
      return prev.concat([{
        who: who,
        text: text || '',
        isPrompt: isPrompt || false,
        cat: cat || '',
        output: output || '',
        id: Date.now() + Math.random()
      }])
    })
  }

  const handleSend = async () => {
    var msg = input.trim()
    if (!msg || loading) return
    if (!canGenerate) { setShowPaywall(true); return }

    setInput('')
    addMessage('user', msg)
    setLoading(true)

    try {
      var loadingMsgs = {
        biz: '📊 Analysing and constructing your framework...',
        brand: '✦ Crafting your brand strategy...',
        builder: '🏗️ Building your website...',
        knowledge: '🌍 Researching deeply across all fields of knowledge...'
      }
      addMessage('ai', loadingMsgs[mode])
      var result = await generatePrompt(msg, mode, activeCat)

      setMessages(function(prev) {
        var copy = prev.slice()
        copy[copy.length - 1] = Object.assign({}, copy[copy.length - 1], {
          text: MODE_CONFIG[mode].icon + ' Here is your ' + activeCat + ':'
        })
        return copy
      })

      addMessage('ai', result, true, activeCat, result)

      if (user) {
        await savePrompt(user.id, msg, result, mode, activeCat).catch(function() {})
        var newUsed = promptsUsed + 1
        setPromptsUsed(newUsed)
        await updatePromptsUsed(user.id, newUsed).catch(function() {})
        refreshPlan()
      }

      if (!isPro && trialLeft - 1 <= 0) {
        setTimeout(function() {
          addMessage('ai', 'You have used all your free prompts. Upgrade to Ortus Pro for unlimited access.')
          setShowPaywall(true)
        }, 1000)
      }
    } catch (err) {
      addMessage('ai', 'Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = (code) => {
    if (!code) {
      addMessage('ai', 'No code found. Please generate a website first.')
      return
    }
    try {
      var blob = new Blob([code], { type: 'text/html' })
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url
      a.download = 'ortus-website.html'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addMessage('ai', 'Website downloaded! Go to netlify.com/drop and drag the file — your site will be live in 30 seconds!')
    } catch (err) {
      addMessage('ai', 'Download failed: ' + err.message)
    }
  }

  const loadHistory = async () => {
    if (!user) return
    var h = await getPromptHistory(user.id).catch(function() { return [] })
    setHistory(h || [])
    setShowHistory(true)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(function() {})
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  var cats = mode === 'biz' ? BIZ_CATS : mode === 'brand' ? BRAND_CATS : mode === 'builder' ? BUILDER_CATS : KNOWLEDGE_CATS
  var freeLeft = Math.max(0, 3 - promptsUsed)

  return (
    <div className={styles.app}>
      <div className={styles.topbar}>
        <div className={styles.logo}>ORT<span>US</span></div>
        <div className={styles.modeToggle}>
          {Object.keys(MODE_CONFIG).map(function(m) {
            return (
              <button
                key={m}
                className={styles.modeBtn + ' ' + getStyle('mode', m) + (mode === m ? ' ' + styles.modeActive : '')}
                onClick={function() { switchMode(m) }}
              >{MODE_CONFIG[m].label}</button>
            )
          })}
        </div>
        <div className={styles.topRight}>
          <button className={styles.iconBtn} onClick={loadHistory}>⊙</button>
          <button className={styles.iconBtn} onClick={handleSignOut}>↩</button>
        </div>
      </div>

      {!isPro && (
        <div className={styles.trialBar}>
          <span>{freeLeft > 0 ? '✦ ' + freeLeft + ' free prompt' + (freeLeft !== 1 ? 's' : '') + ' remaining' : '✦ Free trial ended'}</span>
          <button onClick={function() { setShowPaywall(true) }}>UPGRADE TO PRO</button>
        </div>
      )}
      {isPro && (
        <div className={styles.trialBar + ' ' + styles.proBanner}>
          <span>✦ Ortus Pro — Unlimited · Business · Brand · Builder · Knowledge</span>
        </div>
      )}

      <div className={styles.cats}>
        {cats.map(function(cat) {
          return (
            <button
              key={cat}
              className={styles.cat + (activeCat === cat ? ' ' + getStyle('catActive', mode) : '')}
              onClick={function() { handleCatChange(cat) }}
            >{cat}</button>
          )
        })}
      </div>

      <div className={styles.chat} ref={chatRef}>
        {messages.map(function(msg) {
          return (
            <div key={msg.id} className={styles.msg + (msg.who === 'user' ? ' ' + styles.userMsg : '')}>
              <div className={styles.avatar + ' ' + (msg.who === 'user' ? styles.avatarUser : getStyle('avatar', mode))}>
                {msg.who === 'user' ? 'U' : 'O'}
              </div>
              <div className={styles.msgBody}>
                <div className={styles.msgName + (msg.who !== 'user' ? ' ' + getStyle('name', mode) : '')}>
                  {msg.who === 'user' ? 'You' : 'Ortus · ' + (MODE_CONFIG[mode] ? MODE_CONFIG[mode].label : '')}
                </div>
                {msg.isPrompt ? (
                  <div className={styles.outputCard + ' ' + getStyle('output', mode)}>
                    <div className={styles.outputLabel + ' ' + getStyle('label', mode)}>
                      {MODE_CONFIG[mode] ? MODE_CONFIG[mode].icon : ''} {msg.cat}
                    </div>
                    <div className={styles.outputText}>{msg.output}</div>
                    <div className={styles.outputActions}>
                      <span className={styles.outputType}>Ortus · {MODE_CONFIG[mode] ? MODE_CONFIG[mode].label : ''}</span>
                      <div className={styles.actionBtns}>
                        <button className={styles.actBtn + ' ' + getStyle('act', mode)} onClick={function() { copyToClipboard(msg.output) }}>Copy</button>
                        {mode === 'builder' && (
                          <button
                            className={styles.actBtn + ' ' + styles.actBuilder}
                            onClick={function() { var code = extractCode(msg.output); setPreviewCode(code || msg.output); setShowPreview(true) }}
                          >Preview</button>
                        )}
                        {mode === 'builder' && (
                          <button
                            className={styles.actBtn + ' ' + styles.actBuilder}
                            onClick={function() { handleDeploy(extractCode(msg.output) || msg.output) }}
                          >Deploy</button>
                        )}
                        <button
                          className={styles.actBtn + ' ' + getStyle('act', mode)}
                          onClick={function() { setInput('Refine this further with more depth and detail') }}
                        >Refine</button>
                      </div>
                    </div>
                    {previewUrl && mode === 'builder' && (
                      <div className={styles.liveUrl}>
                        Live: <a href={previewUrl} target="_blank" rel="noreferrer">{previewUrl}</a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.bubble}>{msg.text}</div>
                )}
              </div>
            </div>
          )
        })}
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
            onChange={function(e) { setInput(e.target.value) }}
            onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={MODE_CONFIG[mode] ? MODE_CONFIG[mode].placeholder : ''}
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
              <button className={styles.actBtn + ' ' + styles.actBuilder} onClick={function() { copyToClipboard(previewCode) }}>Copy Code</button>
              <button className={styles.actBtn + ' ' + styles.actBuilder} onClick={function() { handleDeploy(previewCode) }}>Deploy</button>
              <button className={styles.closeBtn} onClick={function() { setShowPreview(false) }}>Close</button>
            </div>
          </div>
          <iframe
            src={previewCode ? URL.createObjectURL(new Blob([previewCode], {type: 'text/html'})) : ''}
            className={styles.previewFrame}
            title="Preview"
          />
        </div>
      )}

      {showHistory && (
        <div className={styles.drawer}>
          <div className={styles.drawerHead}>
            <span className="label">History</span>
            <button className={styles.closeBtn} onClick={function() { setShowHistory(false) }}>✕</button>
          </div>
          <div className={styles.drawerList}>
            {history.length === 0 && <p className={styles.emptyNote}>No history yet.</p>}
            {history.map(function(h) {
              return (
                <div key={h.id} className={styles.historyItem} onClick={function() { setInput(h.prompt); setShowHistory(false) }}>
                  <div className={styles.historyMode + ' ' + getStyle('label', h.mode)}>{MODE_CONFIG[h.mode] ? MODE_CONFIG[h.mode].icon : ''} {h.category}</div>
                  <div className={styles.historyPrompt}>{h.prompt}</div>
                  <div className={styles.historyDate}>{new Date(h.created_at).toLocaleDateString()}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showPaywall && <Paywall onClose={function() { setShowPaywall(false) }} onSuccess={refreshPlan} />}
    </div>
  )
}
