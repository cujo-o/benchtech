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
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  products?: any[]
}

const QUICK_PROMPTS = [
  'Laptop for coding & multitasking under ₦500k',
  'Clean iPhone with 85%+ battery health under ₦350k',
  'Best value gaming laptop available in Abuja',
  'Affordable student laptop for research & projects',
]

export function FindMyTechChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your **BenchTech AI Consultant**. What kind of gadget are you looking for today? Tell me your budget, primary work (e.g. software development, design, gaming), or preferred brands!",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-8rem)]">
      {/* Chat Header */}
      <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900">Find My Tech AI</h2>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Store Advisor
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Trained on active Abuja electronics inventory</p>
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
          className="text-slate-400 hover:text-slate-900 text-xs font-bold gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </Button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 max-w-3xl ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-blue-600" />}
            </div>

            <div className="space-y-3 flex-1 min-w-0">
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none ml-auto max-w-md'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none whitespace-pre-line'
                }`}
              >
                {msg.content}
              </div>

              {/* Embedded Product Cards */}
              {msg.products && msg.products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {msg.products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-sm hover:border-blue-400 transition"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center overflow-hidden shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">Gadget</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-black uppercase text-blue-600">
                            {product.brand}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {product.title}
                          </h4>
                          <p className="text-xs font-black text-slate-900 mt-0.5">
                            ₦{Number(product.price).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                        <AddToCartButton product={product} variant="full" />
                        <CompareButton product={product as any} />
                        <Link href={`/products/${product.id}`} className="ml-auto">
                          <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-500">
                            View <ArrowRight className="w-3 h-3 ml-1" />
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
          <div className="flex gap-3 max-w-lg">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 rounded-tl-none flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              Checking Abuja inventory &amp; evaluating hardware specs...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none bg-slate-50/50">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full whitespace-nowrap hover:border-blue-500 hover:text-blue-600 transition shadow-xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-slate-200 bg-white">
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
            placeholder="e.g. I need a MacBook or ThinkPad for video editing with 16GB RAM under ₦700k..."
            className="flex-1 h-11 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-2 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Ask AI</span>
          </Button>
        </form>
      </div>
    </div>
  )
}