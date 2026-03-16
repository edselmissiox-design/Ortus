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
  const [promptsUsed, setPromptsUsed] = useState(plan?.prompts_used ?? 0)
  const chatRef = useRef(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    addMessage('ai', `Welcome to Ortus${user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}. I am your ${mode === 'biz' ? 'Business AI — analytical, strategic, structured' : 'Brand AI — creative, visual, expressive'}. Select a category and tell me what you need.`)
  }, [user])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const switchMode = (m) => {
    setMode(m)
    setActiveCat(m === 'biz' ? 'Business Plan' : 'Brand Identity')
    addMessage('ai', m === 'biz'
      ? 'Switched to Business Mode — analytical, strategic, structured.'
      : 'Switched to Brand Mode — creative, visual, expressive.')
  }

  const addMessage = (who, text, isPrompt = false, cat = '', output = '') => {
    setMessages(prev => [...prev, { who, text, isPrompt, cat, output, id: Date.now() + Math.random() }])
  }

  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    if (!canGenerate) { setShowPaywall(true); return }

    setInput('')
    addMessage('user', msg)
    setLoading(true)

    try {
      addMessage('ai', `Generating your ${activeCat} prompt...`)
      const result = await generatePrompt(msg, mode, activeCat)

      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { ...copy[copy.length - 1], text: `Here is your ${activeCat} prompt:` }
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
          addMessage('ai', "You have used all your free prompts. Upgrade to Ortus Pro for unlimited access.")
          setShowPaywall(true)
        }, 1000)
      }
    } catch (err) {
      addMessage('ai', `Error: ${err.message}`)
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
          <button className={`${styles.modeBtn} ${styles.modeBiz} ${mode === 'biz' ? styles.modeActive : ''}`} onClick={() => switchMode('biz')}>Business</button>
          <button className={`${styles.modeBtn} ${styles.modeBrand} ${mode === 'brand' ? styles.modeActive : ''}`} onClick={() => switchMode('brand')}>Brand</button>
        </div>
        <div className={styles.topRight}>
          <button className={styles.iconBtn} onClick={loadHistory}>⊙</button>
          <button className={styles.iconBtn} onClick={handleSignOut}>↩</button>
        </div>
      </div>

      {!isPro && (
        <div className={styles.trialBar}>
          <span>{freeLeft > 0 ? `✦ ${freeLeft} free prompt${freeLeft !== 1 ? 's' : ''} remaining` : '✦ Free trial ended'}</span>
          <button onClick={() => setShowPaywall(true)}>UPGRADE TO PRO</button>
        </div>
      )}
      {isPro && (
        <div className={`${styles.trialBar} ${styles.proBanner}`}>
          <span>✦ Ortus Pro — Unlimited prompts · Both modes</span>
        </div>
      )}

      <div className={styles.cats}>
        {cats.map(cat => (
          <button
            key={cat}
            className={`${styles.cat} ${activeCat === cat ? (mode === 'biz' ? styles.catActiveBiz : styles.catActiveBrand) : ''}`}
            onClick={() => setActiveCat(cat)}
          >{cat}</button>
        ))}
      </div>

      <div className={styles.chat} ref={chatRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.msg} ${msg.who === 'user' ? styles.userMsg : ''}`}>
            <div className={`${styles.avatar} ${msg.who === 'user' ? styles.avatarUser : (mode === 'biz' ? styles.avatarBiz : styles.avatarBrand)}`}>
              {msg.who === 'user' ? (user?.user_metadata?.full_name?.[0] ?? 'U') : 'O'}
            </div>
            <div className={styles.msgBody}>
              <div className={`${
