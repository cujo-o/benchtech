'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitVerification } from './actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  ShieldCheck, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Trash2, 
  ArrowRight,
  Sparkles,
  Building2
} from 'lucide-react'

export default function SellerVerificationPage() {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [idType, setIdType] = useState('nin')
  
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [idUploadPath, setIdUploadPath] = useState<string>('')
  const [uploadingId, setUploadingId] = useState(false)

  const [cacFile, setCacFile] = useState<File | null>(null)
  const [cacPreview, setCacPreview] = useState<string | null>(null)
  const [cacUploadPath, setCacUploadPath] = useState<string>('')
  const [uploadingCac, setUploadingCac] = useState(false)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const idInputRef = useRef<HTMLInputElement>(null)
  const cacInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    }
    load()
  }, [supabase])

  // File selection and preview handler
  async function handleFileSelect(file: File, type: 'id' | 'cac') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const isImage = file.type.startsWith('image/')
    const previewUrl = isImage ? URL.createObjectURL(file) : null

    if (type === 'id') {
      setIdFile(file)
      setIdPreview(previewUrl)
      setUploadingId(true)
    } else {
      setCacFile(file)
      setCacPreview(previewUrl)
      setUploadingCac(true)
    }

    try {
      const ext = file.name.split('.').pop()
      const filePath = `${user.id}/${type}-${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from('vendor-documents')
        .upload(filePath, file, { upsert: true })

      if (error) throw error

      if (type === 'id') setIdUploadPath(filePath)
      if (type === 'cac') setCacUploadPath(filePath)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'File upload failed' })
    } finally {
      if (type === 'id') setUploadingId(false)
      if (type === 'cac') setUploadingCac(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!idUploadPath) {
      setMessage({ type: 'error', text: 'Please upload a valid government ID before submitting.' })
      return
    }

    setLoading(true)
    setMessage(null)

    const formData = new FormData()
    formData.set('idType', idType)
    formData.set('idDocumentUrl', idUploadPath)
    if (cacUploadPath) formData.set('cacDocumentUrl', cacUploadPath)

    const res = await submitVerification(formData)
    if (res?.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: 'Documents submitted successfully! BenchTech review will be completed in 24 hours.' })
      setProfile((prev: any) => ({ ...prev, tech_trust_status: 'pending' }))
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-black text-slate-900">TechTrust Store Verification</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Verify your business identity in Abuja to unlock the TechTrust badge, boost organic buyer rank, and eliminate WhatsApp skepticism.
        </p>
      </div>

      {/* Status Cards */}
      {profile?.tech_trust_status === 'verified' && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4 text-emerald-900">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold">Your Store is TechTrust Verified</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                All your gadget listings prominently display the green verified badge and receive priority placement in catalog searches.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {profile?.tech_trust_status === 'pending' && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4 text-amber-900">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold">Verification Under Compliance Review</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your submitted credentials are being reviewed by the BenchTech Abuja verification desk. Status will update within 24 hours.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {message && (
        <div className={`p-4 text-xs rounded-2xl border flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Submission */}
      {profile?.tech_trust_status !== 'verified' && profile?.tech_trust_status !== 'pending' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border border-slate-200/80 shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-900">Store Verification Dossier</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Upload clear government credentials for the registered store owner.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Document Type Dropdown */}
              <div>
                <Label htmlFor="idType" className="text-xs font-bold text-slate-700">Identity Document Type</Label>
                <select
                  id="idType"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full mt-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="nin">National Identity Card / NIN Digital Slip</option>
                  <option value="drivers_license">FRSC Driver&apos;s License</option>
                  <option value="voters_card">INEC Permanent Voter&apos;s Card (PVC)</option>
                  <option value="passport">Nigerian International Passport</option>
                </select>
              </div>

              {/* 1. Primary Government ID File Box */}
              <div>
                <Label className="text-xs font-bold text-slate-700 block mb-1.5">
                  1. Upload Government ID Document <span className="text-red-500">*</span>
                </Label>
                <input
                  ref={idInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'id')}
                />

                {!idFile ? (
                  <div
                    onClick={() => idInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Click or drop your ID here</p>
                    <p className="text-[11px] text-slate-400">Supports PNG, JPG, or PDF (Max 10MB)</p>
                  </div>
                ) : (
                  <div className="p-3 border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {idPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={idPreview} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate max-w-xs">{idFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(idFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadingId ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      ) : idUploadPath ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Uploaded</span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => { setIdFile(null); setIdPreview(null); setIdUploadPath(''); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Optional CAC Registration File Box */}
              <div>
                <Label className="text-xs font-bold text-slate-700 block mb-1.5">
                  2. CAC Business Registration Document (Optional)
                </Label>
                <input
                  ref={cacInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'cac')}
                />

                {!cacFile ? (
                  <div
                    onClick={() => cacInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-purple-100 flex items-center justify-center text-slate-400 group-hover:text-purple-600 transition">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Add CAC Certificate / BN Status</p>
                    <p className="text-[11px] text-slate-400">Recommended for Banex / Wuse physical retailers</p>
                  </div>
                ) : (
                  <div className="p-3 border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {cacPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cacPreview} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                          <Building2 className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate max-w-xs">{cacFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(cacFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadingCac ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      ) : cacUploadPath ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Uploaded</span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => { setCacFile(null); setCacPreview(null); setCacUploadPath(''); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || uploadingId || uploadingCac || !idUploadPath}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-11 rounded-xl gap-2 shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Submit Documents for TechTrust Verification
              </Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  )
}