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
  const [history, setHistory] = useState([])
  const [promptsUsed, setPromptsUsed] = useState(0)
  const chatRef = useRef(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    addMessage('ai', 'Welcome to Ortus. Four powerful AI modes: Business, Brand, Builder and Knowledge. Select a mode and category, then tell me what you need.')
  }, [user])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const getActiveStyle = (m) => {
    if (m === 'biz') return styles.catActiveBiz
    if (m === 'brand') return styles.catActiveBrand
    if (m === 'builder') return styles.catActiveBuilder
    return styles.catActiveKnowledge
  }

  const getAvatarStyle = (m) => {
    if (m === 'biz') return styles.avatarBiz
    if (m === 'brand') return styles.avatarBrand
    if (m === 'builder') return styles.avatarBuilder
    return styles.avatarKnowledge
  }

  const getNameStyle = (m) => {
    if (m === 'biz') return styles.nameBiz
    if (m === 'brand') return styles.nameBrand
    if (m === 'builder') return styles.nameBuilder
    return styles.nameKnowledge
  }

  const getOutputStyle = (m) => {
    if (m === 'biz') return styles.outputBiz
    if (m === 'brand') return styles.outputBrand
    if (m === 'builder') return styles.outputBuilder
    return styles.outputKnowledge
  }

  const getLabelStyle = (m) => {
    if (m === 'biz') return styles.labelBiz
    if (m === 'brand') return styles.labelBrand
    if (m === 'builder') return styles.labelBuilder
    return styles.labelKnowledge
  }

  const getActStyle = (m) => {
    if (m === 'biz') return styles.actBiz
    if (m === 'brand') return styles.actBrand
    if (m === 'builder') return styles.actBuilder
    return styles.actKnowledge
  }

  const getTypingStyle = (m) => {
    if (m === 'biz') return styles.typingBiz
    if (m === 'brand') return styles.typingBrand
    if (m === 'builder') return styles.typingBuilder
    return styles.typingKnowledge
  }

  const getSendStyle = (m) => {
    if (m === 'biz') return styles.sendBiz
    if (m === 'brand') return styles.sendBrand
    if (m === 'builder') return styles.sendBuilder
    return styles.sendKnowledge
  }

  const getModeName = (m) => {
    if (m === 'biz') return 'Ortus · Business'
    if (m === 'brand') return 'Ortus · Brand'
    if (m === 'builder') return 'Ortus · Builder'
    return 'Ortus · Knowledge'
  }

  const getModeIcon = (m) => {
    if (m === 'biz') return '📊'
    if (m === 'brand') return '✦'
    if (m === 'builder') return '🏗️'
    return '🌍'
  }

  const switchMode = (m) => {
    setMode(m)
    resetConversation()
    if (m === 'biz') setActiveCat('Business Plan')
    else if (m === 'brand') setActiveCat('Brand Identity')
    else if (m === 'builder') setActiveCat('Landing Page')
    else setActiveCat('Universe & Space')
    const names = {
      biz: 'Switched to Business Mode — analytical, strategic, structured.',
      brand: 'Switched to Brand Mode — creative, visual, expressive.',
      builder: 'Switched to Builder Mode — building complete websites and apps.',
      knowledge: 'Switched to Knowledge Mode — deep research on any topic. Select a category above and ask me anything.'
    }
    addMessage('ai', names[m])
  }

  const handleCatChange = (cat) => {
    setActiveCat(cat)
    resetConversation()
  }

  const addMessage = (who, text, isPrompt, cat, output) => {
    setMessages(prev => [...prev, {
      who,
      text: text || '',
      isPrompt: isPrompt || false,
      cat: cat || '',
      output: output || '',
      id: Date.now() + Math.random()
    }])
  }

  const extractCode = (text) => {
    const match = text.match(/```(?:html)?\n?([\s\S]*?)```/)
    return match ? match[1] : null
  }

  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    if (!canGenerate) { setShowPaywall(true); return }

    setInput('')
    addMessage('user', msg)
    setLoading(true)

    try {
      const loadingMessages = {
        biz: 'Analysing and building your framework...',
        brand: 'Crafting your brand strategy...',
        builder: 'Building your website...',
        knowledge: 'Researching deeply across all knowledge...'
      }
      addMessage('ai', loadingMessages[mode])
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
      }

      if (!isPro && trialLeft - 1 <= 0) {
        setTimeout(() => {
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
          <button className={styles.modeBtn + ' ' + styles.modeBiz + (mode === 'biz' ? ' ' + styles.modeActive : '')} onClick={() => switchMode('biz')}>Business</button>
          <button className={styles.modeBtn + ' ' + styles.modeBrand + (mode === 'brand' ? ' ' + styles.modeActive : '')} onClick={() => switchMode('brand')}>Brand</button>
          <button className={styles.modeBtn + ' ' + styles.modeBuilder + (mode === 'builder' ? ' ' + styles.modeActive : '')} onClick={() => switchMode('builder')}>Builder</button>
          <button className={styles.modeBtn + ' ' + styles.modeKnowledge + (mode === 'knowledge' ? ' ' + styles.modeActive : '')} onClick={() => switchMode('knowledge')}>Knowledge</button>
        </div>
        <div className={styles.topRight}>
          <button className={styles.iconBtn} onClick={loadHistory}>⊙</button>
          <button className={styles.iconBtn} onClick={handleSignOut}>↩</button>
        </div>
      </div>

      {!isPro && (
        <div className={styles.trialBar}>
          <span>{freeLeft > 0 ? '✦ ' + freeLeft + ' free prompt' + (freeLeft !== 1 ? 's' : '') + ' remaining' : '✦ Free trial ended'}</span>
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
            className={styles.cat + (activeCat === cat ? ' ' + getActiveStyle(mode) : '')}
            onClick={() => handleCatChange(cat)}
          >{cat}</button>
        ))}
      </div>

      <div className={styles.chat} ref={chatRef}>
        {messages.map(msg => (
          <div key={msg.id} className={styles.msg + (msg.who === 'user' ? ' ' + styles.userMsg : '')}>
            <div className={styles.avatar + ' ' + (msg.who === 'user' ? styles.avatarUser : getAvatarStyle(mode))}>
              {msg.who === 'user' ? 'U' : 'O'}
            </div>
            <div className={styles.msgBody}>
              <div className={styles.msgName + (msg.who !== 'user' ? ' ' + getNameStyle(mode) : '')}>
                {msg.who === 'user' ? 'You' : getModeName(mode)}
              </div>
              {msg.isPrompt ? (
                <div className={styles.outputCard + ' ' + getOutputStyle(mode)}>
                  <div className={styles.outputLabel + ' ' + getLabelStyle(mode)}>
                    {getModeIcon(mode)} {msg.cat}
                  </div>
                  <div className={styles.outputText}>{msg.output}</div>
                  <div className={styles.outputActions}>
                    <span className={styles.outputType}>{getModeName(mode)}</span>
                    <div className={styles.actionBtns}>
                      <button className={styles.actBtn + ' ' + getActStyle(mode)} onClick={() => copyToClipboard(msg.output)}>Copy</button>
                      {mode === 'builder' && extractCode(msg.output) && (
                        <button className={styles.actBtn + ' ' + styles.actBuilder} onClick={() => { setPreviewCode(extractCode(msg.output)); setShowPreview(true) }}>Preview</button>
                      )}
                      <button className={styles.actBtn + ' ' + getActStyle(mode)} onClick={() => setInput('Refine this further with more depth and detail')}>Refine</button>
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
            <div className={styles.avatar + ' ' + getAvatarStyle(mode)}>O</div>
            <div className={styles.msgBody}>
              <div className={styles.typing + ' ' + getTypingStyle(mode)}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputRow}>
          <textarea
            className={styles.inputBox + ' ' + (mode === 'biz' ? styles.inputBiz : mode === 'brand' ? styles.inputBrand : mode === 'builder' ? styles.inputBuilder : styles.inputKnowledge)}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={
              mode === 'biz' ? 'e.g. Build me an investor pitch for a fragrance brand...' :
              mode === 'brand' ? 'e.g. Create a brand identity for a luxury streetwear label...' :
              mode === 'builder' ? 'e.g. Build me a full stack e-commerce app for fragrances...' :
              'e.g. Explain how the universe was created and what existed before the Big Bang...'
            }
            rows={1}
          />
          <button
            className={styles.sendBtn + ' ' + getSendStyle(mode)}
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
                <div className={styles.historyMode + ' ' + getLabelStyle(h.mode)}>{getModeIcon(h.mode)} {h.category}</div>
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
