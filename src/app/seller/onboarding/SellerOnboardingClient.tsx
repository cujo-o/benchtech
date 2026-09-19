'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSellerAccount } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Store, ShieldCheck, MapPin, Phone, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

export function SellerOnboardingClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    const result = await createSellerAccount(formData)

    if (result?.error) {
      setErrorMsg(result.error)
      setLoading(false)
    } else {
      router.push('/seller')
      router.refresh()
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center mx-auto shadow-md shadow-blue-500/20 text-lg">
            B
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Open Your BenchTech Store</h1>
          <p className="text-xs text-slate-500">
            Start listing gadgets to prospective buyers across Abuja today.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <Card className="border border-slate-200/80 shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-600" />
              Vendor Store Setup
            </CardTitle>
            <CardDescription className="text-xs">
              Tell buyers about your shop or retail presence in Abuja.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="businessName" className="text-xs font-bold text-slate-700">
                  Store / Brand Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="businessName"
                  name="businessName"
                  placeholder="e.g. Banex Prime Gadgets"
                  required
                  className="mt-1.5 h-10 text-xs bg-slate-50/50"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs font-bold text-slate-700">
                  Active WhatsApp / Call Phone <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="080 1234 5678"
                    required
                    className="h-10 text-xs pl-9 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="district" className="text-xs font-bold text-slate-700">
                  Abuja District / Commercial Hub
                </Label>
                <div className="relative mt-1.5">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    id="district"
                    name="district"
                    defaultValue="Wuse 2"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Wuse 2">Wuse 2 (Banex Plaza / Aminu Kano)</option>
                    <option value="Central Business District">Central Area / CBD</option>
                    <option value="Garki">Garki (Area 1 - Area 11)</option>
                    <option value="Maitama">Maitama</option>
                    <option value="Gwarinpa">Gwarinpa Estate</option>
                    <option value="Apo">Apo / Legislative Quarters</option>
                    <option value="Kubwa">Kubwa</option>
                    <option value="Lugbe">Lugbe / Airport Road</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting Up Store...
                    </>
                  ) : (
                    <>
                      Complete Store Setup <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            After setup, you can immediately upload products and request a <strong>TechTrust Verified</strong> badge by uploading identity credentials.
          </p>
        </div>
      </div>
    </div>
  )
}