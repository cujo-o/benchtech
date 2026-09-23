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
  'Gaming laptop in Abuja',
]

export function FindMyTechChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your BenchTech AI Consultant. Tell me your budget, primary work (coding, design, gaming), or target specs and I'll find matching gadgets available in Abuja!",
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
    <div className="w-full flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden h-[540px] sm:h-[580px] max-w-2xl w-full transition-colors">
        {/* Compact Header */}
        <div className="p-3 sm:p-3.5 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                  Find My Tech AI
                </h2>
                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-1.5 py-0.2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Advisor</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
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
            className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-bold gap-1 h-7 px-2 rounded-xl"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="text-[11px]">Reset</span>
          </Button>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 max-w-xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-3 h-3" />
                ) : (
                  <Bot className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                )}
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs ml-auto shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-tl-xs whitespace-pre-line'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Embedded Recommendations */}
                {msg.products && msg.products.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {msg.products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-2.5 space-y-2 shadow-2xs hover:border-blue-400 transition"
                      >
                        <div className="flex gap-2 items-center">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
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
                            <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 block truncate">
                              {product.brand || 'Gadget'}
                            </span>
                            <h4 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                              {product.title}
                            </h4>
                            <p className="text-[11px] font-black text-slate-900 dark:text-slate-100">
                              ₦{Number(product.price).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <AddToCartButton product={product} variant="full" />
                          <CompareButton product={product as any} />
                          <Link href={`/products/${product.id}`} className="ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] font-bold text-slate-500 hover:text-blue-600 px-2"
                            >
                              View <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
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
            <div className="flex gap-2 max-w-sm">
              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <Bot className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-800 rounded-tl-xs flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                <span>Checking Abuja tech inventory...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions Chips */}
        <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Ideas:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full whitespace-nowrap hover:border-blue-500 hover:text-blue-600 transition shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-2.5 sm:p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for MacBook, iPhone, specs, budget..."
              className="flex-1 h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-1 shadow-xs cursor-pointer shrink-0"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}