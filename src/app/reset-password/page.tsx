'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updatePassword } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Lock, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const res = await updatePassword(formData)

    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/login?message=Password%20updated!%20Please%20log%20in.')
      }, 2000)
    }
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
          <h1 className="text-xl font-black text-slate-900">Set New Password</h1>
          <p className="text-xs text-slate-500">
            Choose a strong password to secure your BenchTech account.
          </p>
        </div>

        <Card className="border border-slate-200/80 shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            {success ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Password Updated!</h3>
                <p className="text-xs text-slate-600">Redirecting you to sign in...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">New Password</label>
                  <div className="relative">
                    <Input
                      type="password"
                      name="password"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      className="pl-9 h-11 text-xs bg-slate-50 border-slate-200 rounded-xl"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                  <div className="relative">
                    <Input
                      type="password"
                      name="confirmPassword"
                      required
                      minLength={6}
                      placeholder="Re-enter password"
                      className="pl-9 h-11 text-xs bg-slate-50 border-slate-200 rounded-xl"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-xs rounded-xl gap-2 shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  {loading ? 'Updating password...' : 'Update Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
