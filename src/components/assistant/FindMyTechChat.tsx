'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/useCartStore'
import {
  Sparkles,
  Plus,
  ArrowUp,
  ArrowUpRight,
  Wrench,
  Scale,
  Megaphone,
  SlidersHorizontal,
  ShieldCheck,
  ShoppingBag,
  RotateCcw,
  Package,
  MapPin,
  Loader2,
  X,
} from 'lucide-react'

interface ChatProduct {
  id: string
  title: string
  price: number
  condition?: string
  images?: any
  image?: string | null
  brand?: string
  seller_id?: string
  location?: string
  profiles?: any
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  products?: ChatProduct[]
}

const STARTER_PROMPTS = [
  'Best laptop for coding under ₦500k',
  'Compare iPhones with 85%+ battery',
  'Gaming console or monitor in Abuja',
  'Creator camera & vlogging setup',
]

function extractImage(item: ChatProduct): string | null {
  if (item.image) return item.image
  if (Array.isArray(item.images)) return item.images[0] || null
  if (typeof item.images === 'string') {
    try {
      const parsed = JSON.parse(item.images)
      if (Array.isArray(parsed)) return parsed[0] || null
    } catch {
      return item.images.startsWith('http') ? item.images : null
    }
  }
  return null
}

export function FindMyTechChat({
  userName,
}: {
  userName?: string | null
}) {
  const { items: cartItems } = useCartStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [attachedContext, setAttachedContext] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const firstName = userName?.trim().split(/\s+/)[0] || null

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  async function sendMessage(overrideText?: string) {
    const rawText = (overrideText ?? input).trim()
    if (!rawText || loading) return

    const finalPrompt = attachedContext
      ? `[Context: ${attachedContext}] ${rawText}`
      : rawText

    const userMsg: ChatMessage = { role: 'user', content: rawText }
    const nextHistory = [...messages, userMsg]

    setMessages(nextHistory)
    setInput('')
    setAttachedContext(null)
    setMenuOpen(false)
    setLoading(true)

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: finalPrompt,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: finalPrompt },
          ],
        }),
      })

      const data = await res.json()
      const replyText =
        data.reply ||
        data.message ||
        data.response ||
        'I checked the live Abuja catalog but could not generate a reply right now. Please try rephrasing or browse All Categories.'

      const matchedProducts: ChatProduct[] = Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.recommendedProducts)
        ? data.recommendedProducts
        : []

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: replyText,
          products: matchedProducts,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Connection interrupted while reaching BenchTech AI. Please try again in a moment.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleAttachCartContext() {
    if (cartItems.length === 0) {
      setAttachedContext('Evaluate my setup budget and suggest verified Abuja gadgets')
    } else {
      const summary = cartItems
        .map((c) => `${c.title} (₦${Number(c.price).toLocaleString()})`)
        .join(', ')
      setAttachedContext(`My Cart Items: ${summary}`)
    }
    setMenuOpen(false)
    inputRef.current?.focus()
  }

  function handleQuickToolPrompt(promptPrefix: string) {
    setMenuOpen(false)
    setInput(promptPrefix)
    inputRef.current?.focus()
  }

  const hasConversation = messages.length > 0

  return (
    <div className="w-full h-[calc(100vh-68px)] flex flex-col bg-slate-50/70 dark:bg-slate-950">
      {/* 1. Clean Top Workspace Sub-Header */}
      <div className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm px-4 sm:px-6 lg:px-10 py-3.5 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm lg:text-base font-black text-slate-900 dark:text-white leading-tight truncate">
                BenchTech AI
              </h1>
              <p className="text-[11px] lg:text-xs text-slate-500 dark:text-slate-400 truncate">
                Hardware Advisor, Spec Matcher, Budget Finder &amp; Abuja Catalog Search
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasConversation && (
              <button
                type="button"
                onClick={() => {
                  setMessages([])
                  setAttachedContext(null)
                }}
                className="h-9 px-3 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
            )}

            <Link
              href="/build"
              className="h-9 px-3.5 lg:px-4 rounded-full border border-blue-200 dark:border-blue-800/80 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs lg:text-[13px] font-bold inline-flex items-center gap-1.5 transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Build My Setup</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Open Canvas (Empty Welcome Hero OR Active Conversation Stream) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-10">
        {!hasConversation ? (
          <div className="min-h-full max-w-3xl mx-auto flex flex-col items-center justify-center py-10 sm:py-16 text-center space-y-7">
            {/* Centered Emblem */}
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200/70 dark:border-blue-800/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
              <Sparkles className="w-6 h-6 lg:w-7 lg:h-7" />
            </div>

            {/* Bold Personalized Greeting */}
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {firstName
                  ? `${firstName}, what tech are we finding or building today?`
                  : 'What tech are we finding or building today?'}
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
                Ask about laptops, smartphones, cameras, consoles, specs, or Abuja pricing — or tap the{' '}
                <strong className="text-slate-800 dark:text-slate-200">+</strong> button below to attach cart items and open BenchTech tools.
              </p>
            </div>

            {/* 2x2 Suggestion Prompt Cards */}
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="group text-left px-4 py-3.5 lg:px-5 lg:py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-xs flex items-center justify-between gap-3 transition cursor-pointer"
                >
                  <span className="text-xs lg:text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {prompt}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 lg:py-8 space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                } space-y-3`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-3xl px-4 py-3 lg:px-5 lg:py-3.5 text-xs sm:text-sm lg:text-[15px] leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white font-semibold rounded-br-md shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md shadow-2xs'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Inline Matching Abuja Hardware Cards */}
                {msg.role === 'assistant' &&
                  msg.products &&
                  msg.products.length > 0 && (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {msg.products.slice(0, 4).map((prod) => {
                        const imgUrl = extractImage(prod)
                        const seller = Array.isArray(prod.profiles)
                          ? prod.profiles[0]
                          : prod.profiles
                        return (
                          <Link
                            key={prod.id}
                            href={`/products/${prod.id}`}
                            className="group p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 flex items-center gap-3.5 shadow-2xs transition"
                          >
                            <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                              {imgUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={imgUrl}
                                  alt={prod.title}
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-xs lg:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                {prod.title}
                              </p>
                              <p className="text-sm lg:text-base font-black text-blue-600 dark:text-blue-400">
                                ₦{Number(prod.price || 0).toLocaleString()}
                              </p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {seller?.district || prod.location || 'Abuja'} •{' '}
                                  {prod.condition?.replace(/_/g, ' ') || 'Verified'}
                                </span>
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs lg:text-sm font-semibold text-slate-500 dark:text-slate-400 px-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Searching verified Abuja inventory...</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 3. Bottom Floating Pill Composer + Popover Tools Menu */}
      <div className="w-full px-4 sm:px-6 lg:px-10 pb-5 pt-2 shrink-0">
        <div className="max-w-3xl mx-auto relative" ref={menuRef}>
          {/* Floating "+" Tools Popover (QuineWorld Style) */}
          {menuOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-2 space-y-1 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                type="button"
                onClick={handleAttachCartContext}
                className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-start gap-3 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs lg:text-[13px] font-bold text-slate-900 dark:text-white block">
                    Attach From My Cart ({cartItems.length})
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Ask AI to review or pair items already in your cart
                  </span>
                </div>
              </button>

              <Link
                href="/build"
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-start gap-3 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs lg:text-[13px] font-bold text-slate-900 dark:text-white block">
                    Build My Setup Wizard
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Guided laptop, phone, camera, or workstation builder
                  </span>
                </div>
              </Link>

              <Link
                href="/compare"
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-start gap-3 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs lg:text-[13px] font-bold text-slate-900 dark:text-white block">
                    Compare Hardware Specs
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Put two devices side by side on specs and Abuja price
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() =>
                  handleQuickToolPrompt('Find the best hardware under ₦')
                }
                className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-start gap-3 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs lg:text-[13px] font-bold text-slate-900 dark:text-white block">
                    Smart Budget Finder
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Match live Abuja listings strictly under your budget
                  </span>
                </div>
              </button>

              <Link
                href="/requests/new"
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-start gap-3 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs lg:text-[13px] font-bold text-slate-900 dark:text-white block">
                    Broadcast Device Request
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Notify verified Abuja stores when an item isn&apos;t listed
                  </span>
                </div>
              </Link>

              <Link
                href="/help"
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-start gap-3 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs lg:text-[13px] font-bold text-slate-900 dark:text-white block">
                    Inspection &amp; Safety Guide
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Handover OTP, IMEI checks, and 7-day escrow protection
                  </span>
                </div>
              </Link>
            </div>
          )}

          {/* Attached Context Pill */}
          {attachedContext && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 max-w-full">
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{attachedContext}</span>
              <button
                type="button"
                onClick={() => setAttachedContext(null)}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Pill Composer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 focus-within:border-blue-500 dark:focus-within:border-blue-500 rounded-full p-2 pl-2.5 shadow-lg shadow-slate-900/5 dark:shadow-black/30 flex items-center gap-2.5 transition"
          >
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Open BenchTech AI Tools"
              className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer ${
                menuOpen
                  ? 'bg-blue-600 text-white rotate-45'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600'
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message BenchTech AI..."
              className="flex-1 bg-transparent text-xs sm:text-sm lg:text-[15px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none py-2"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer ${
                input.trim() && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4 lg:w-5 lg:h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}