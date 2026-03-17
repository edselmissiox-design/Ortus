import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { generatePrompt } from '../lib/ai'
import { savePrompt, getPromptHistory, signOut, updatePromptsUsed } from '../lib/supabase'
import Paywall from '../components/Paywall'
import styles from './App.module.css'

const BIZ_CATS = ['Business Plan', 'Financial Model', 'Marketing Campaign', 'Investor Pitch', 'SOP & Process']
const BRAND_CATS = ['Brand Identity', 'Social Content', 'Ad Copy', 'Brand Voice', 'Visual Direction', 'Launch Strategy']

export default function AppPage() {
  const { user, plan, isPro, trialLeft, canGenerate, refreshPlan } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('biz')
  const [activeCat, setActiveCat] = useState('Business Plan')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [promptsUsed, setPromptsUsed] = useState(0)
  const chatRef = useRef(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    addMessage('ai', 'Welcome to Ortus. I am your AI assistant. Select a mode and category, then tell me what you need.')
  }, [user])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const switchMode = (m) => {
    setMode(m)
    setActiveCat(m === 'biz' ? 'Business Plan' : 'Brand Identity')
    addMessage('ai', m === 'biz'
      ? 'Switched to Business Mode.'
      : 'Switched to Brand Mode.')
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

  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    if (!canGenerate) { setShowPaywall(true); return }

    setInput('')
    addMessage('user', msg)
    setLoading(true)

    try {
      addMessage('ai', 'Generating your prompt...')
      const result = await generatePrompt(msg, mode, activeCat)

      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          text: 'Here is your ' + activeCat + ' prompt:'
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

  const cats = mode === 'biz' ? BIZ_CATS : BRAND_CATS
  const freeLeft = Math.max(0, 3 - promptsUsed)

  return (
    <div className={styles.app}>
      <div className={styles.topbar}>
        <div className={styles.logo}>ORT<span>US</span></div>
        <div className={styles.modeToggle}>
          <button
            className={styles.modeBtn + ' ' + styles.modeBiz + (mode === 'biz' ? ' ' + styles.modeActive : '')}
            onClick={() => switchMode('biz')}
          >Business</button>
          <button
            className={styles.modeBtn + ' ' + styles.modeBrand + (mode === 'brand' ? ' ' + styles.modeActive : '')}
            onClick={() => switchMode('brand')}
          >Brand</button>
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
          <span>✦ Ortus Pro — Unlimited prompts</span>
        </div>
      )}

      <div className={styles.cats}>
        {cats.map(cat => (
          <button
            key={cat}
            className={styles.cat + (activeCat === cat ? ' ' + (mode === 'biz' ? styles.catActiveBiz : styles.catActiveBrand) : '')}
            onClick={() => setActiveCat(cat)}
          >{cat}</button>
        ))}
      </div>

      <div className={styles.chat} ref={chatRef}>
        {messages.map(msg => (
          <div key={msg.id} className={styles.msg + (msg.who === 'user' ? ' ' + styles.userMsg : '')}>
            <div className={styles.avatar + ' ' + (msg.who === 'user' ? styles.avatarUser : (mode === 'biz' ? styles.avatarBiz : styles.avatarBrand))}>
              {msg.who === 'user' ? 'U' : 'O'}
            </div>
            <div className={styles.msgBody}>
              <div className={styles.msgName + (msg.who !== 'user' ? ' ' + (mode === 'biz' ? styles.nameBiz : styles.nameBrand) : '')}>
                {msg.who === 'user' ? 'You' : (mode === 'biz' ? 'Ortus · Business' : 'Ortus · Brand')}
              </div>
              {msg.isPrompt ? (
                <div className={styles.outputCard + ' ' + (mode === 'biz' ? styles.outputBiz : styles.outputBrand)}>
                  <div className={styles.outputLabel + ' ' + (mode === 'biz' ? styles.labelBiz : styles.labelBrand)}>
                    Generated Prompt · {msg.cat}
                  </div>
                  <div className={styles.outputText}>{msg.output}</div>
                  <div className={styles.outputActions}>
                    <span className={styles.outputType}>{mode === 'biz' ? '📊 Business' : '✦ Brand'}</span>
                    <div className={styles.actionBtns}>
                      <button
                        className={styles.actBtn + ' ' + (mode === 'biz' ? styles.actBiz : styles.actBrand)}
                        onClick={() => copyToClipboard(msg.output)}
                      >Copy</button>
                      <button
                        className={styles.actBtn + ' ' + (mode === 'biz' ? styles.actBiz : styles.actBrand)}
                        onClick={() => setInput('Refine this with more detail')}
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
            <div className={styles.avatar + ' ' + (mode === 'biz' ? styles.avatarBiz : styles.avatarBrand)}>O</div>
            <div className={styles.msgBody}>
              <div className={styles.typing + ' ' + (mode === 'biz' ? styles.typingBiz : styles.typingBrand)}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputRow}>
          <textarea
            className={styles.inputBox + ' ' + (mode === 'biz' ? styles.inputBiz : styles.inputBrand)}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={mode === 'biz' ? 'e.g. Build me an investor pitch...' : 'e.g. Create a brand identity brief...'}
            rows={1}
          />
          <button
            className={styles.sendBtn + ' ' + (mode === 'biz' ? styles.sendBiz : styles.sendBrand)}
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

      {showHistory && (
        <div className={styles.drawer}>
          <div className={styles.drawerHead}>
            <span className="label">Prompt History</span>
            <button className={styles.closeBtn} onClick={() => setShowHistory(false)}>✕</button>
          </div>
          <div className={styles.drawerList}>
            {history.length === 0 && (
              <p className={styles.emptyNote}>No prompts yet. Start generating!</p>
            )}
            {history.map(h => (
              <div key={h.id} className={styles.historyItem} onClick={() => { setInput(h.prompt); setShowHistory(false) }}>
                <div className={styles.historyMode + ' ' + (h.mode === 'biz' ? styles.labelBiz : styles.labelBrand)}>
                  {h.mode === 'biz' ? '📊' : '✦'} {h.category}
                </div>
                <div className={styles.historyPrompt}>{h.prompt}</div>
                <div className={styles.historyDate}>{new Date(h.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPaywall && (
        <Paywall onClose={() => setShowPaywall(false)} onSuccess={refreshPlan} />
      )}
    </div>
  )
}
