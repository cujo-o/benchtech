'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { KeyRound, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const res = await requestPasswordReset(formData)

    if (res?.error) {
      setError(res.error)
    } else if (res?.success) {
      setMessage(res.success)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/feed" className="inline-flex items-center gap-2 text-xl font-black text-blue-600">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-md shadow-blue-500/30">
              B
            </span>
            BenchTech
          </Link>
          <h1 className="text-xl font-black text-slate-900">Reset Your Password</h1>
          <p className="text-xs text-slate-500">
            Enter your account email and we’ll send a secure reset link.
          </p>
        </div>

        <Card className="border border-slate-200/80 shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            {message ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Check Your Email</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
                <Link href="/login" className="inline-block mt-4">
                  <Button variant="outline" className="text-xs h-9 font-bold rounded-xl">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Account Email</label>
                  <div className="relative">
                    <Input
                      type="email"
                      name="email"
                      required
                      placeholder="you@example.com"
                      className="pl-9 h-11 text-xs bg-slate-50 border-slate-200 rounded-xl"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-xs rounded-xl gap-2 shadow-sm"
                >
                  <KeyRound className="w-4 h-4" />
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}