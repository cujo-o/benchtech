'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { CompareButton } from '@/components/CompareButton'
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  User,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  products?: any[]
}

const QUICK_PROMPTS = [
  'Laptop for coding under ₦500k',
  'iPhone 85%+ battery under ₦350k',
  'Budget gaming laptop in Abuja',
  'Student laptop for projects',
]

export function FindMyTechChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your BenchTech AI Consultant. What kind of gadget are you looking for today? Tell me your budget, primary workflow (software development, creative design, gaming), or target specs!",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input
    if (!text.trim() || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to get AI response.')
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          products: data.products || [],
        },
      ])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${err.message || 'Something went wrong. Please check your connection or try again.'}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden h-[calc(100dvh-5.5rem)] sm:h-[calc(100vh-6.5rem)] max-w-5xl mx-auto w-full transition-colors">
      {/* 1. Header (Compact for Mobile, Roomy for PC) */}
      <div className="p-3 sm:p-4 px-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Find My Tech AI
              </h2>
              <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Advisor</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">
              Trained on active Abuja electronics inventory
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setMessages([
              {
                role: 'assistant',
                content:
                  "Fresh chat started! What kind of gadget or specification are you hunting for?",
              },
            ])
          }
          className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-bold gap-1.5 h-8 px-2.5 rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>

      {/* 2. Message History Stream */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 sm:gap-3 max-w-3xl ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>

            <div className="space-y-3 flex-1 min-w-0">
              <div
                className={`p-3 sm:p-4 rounded-2xl text-xs sm:text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs ml-auto max-w-[85vw] sm:max-w-md shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-tl-xs whitespace-pre-line'
                }`}
              >
                {msg.content}
              </div>

              {/* Responsive Embedded Product Recommendations */}
              {msg.products && msg.products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {msg.products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 space-y-2.5 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 transition"
                    >
                      <div className="flex gap-2.5 items-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
                          {product.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block truncate">
                            {product.brand || 'Hardware'}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {product.title}
                          </h4>
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">
                            ₦{Number(product.price).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <AddToCartButton product={product} variant="full" />
                        <CompareButton product={product as any} />
                        <Link href={`/products/${product.id}`} className="ml-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600"
                          >
                            Details <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 sm:gap-3 max-w-lg">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 rounded-tl-xs flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Analyzing Abuja tech catalog...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Suggestions Bar */}
      <div className="px-3 sm:px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Suggested:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 sm:px-3 py-1 rounded-full whitespace-nowrap hover:border-blue-500 hover:text-blue-600 transition shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 4. Sticky Input Field */}
      <div className="p-2.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-1.5 sm:gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. MacBook or ThinkPad for coding under ₦600k..."
            className="flex-1 h-10 sm:h-11 px-3 sm:px-4 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-10 sm:h-11 px-4 sm:px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Ask AI</span>
          </Button>
        </form>
      </div>
    </div>
  )
}