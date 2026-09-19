import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Lock,
  Crown,
  ArrowRight,
  Clock,
} from 'lucide-react'

export const metadata = {
  title: 'Bulk Product Upload | BenchTech Seller',
}

export default async function BulkUploadPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/bulk-upload')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Bulk Product Upload
            </h1>
            <Badge className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
              Pro Feature
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload and list multiple smartphones, laptops, or accessories at once using CSV or Excel.
          </p>
        </div>

        <a
          href="/templates/benchtech_products_template.csv"
          download
          className="shrink-0"
        >
          <Button
            variant="outline"
            className="border-slate-200 text-slate-700 font-bold text-xs h-10 rounded-xl gap-2 hover:bg-slate-50"
          >
            <Download className="w-4 h-4 text-blue-600" /> Download Template (.CSV)
          </Button>
        </a>
      </div>

      <div className="relative">
        {/* Free Plan Lock Overlay */}
        {!isPro && (
          <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/80 rounded-3xl flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Bulk Upload is a Pro Feature</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Avoid manually listing devices one by one. Import hundreds of electronics with formatted specifications in seconds with BenchTech Pro.
                </p>
              </div>
              <Link href="/seller/subscription" className="block pt-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs h-11 rounded-xl shadow-md gap-2">
                  Upgrade to Pro — ₦5,000/month <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className={`space-y-6 ${!isPro ? 'select-none pointer-events-none opacity-40' : ''}`}>
          {/* Instructions Step Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50/50 border border-blue-100 rounded-3xl p-5 sm:p-6 text-xs text-slate-700">
            <div className="space-y-1">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] mb-2">1</span>
              <p className="font-bold text-slate-900">Download Template</p>
              <p className="text-slate-500 text-[11px]">Get our official spreadsheet with required Abuja hardware fields.</p>
            </div>
            <div className="space-y-1">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] mb-2">2</span>
              <p className="font-bold text-slate-900">Fill In Specs &amp; Prices</p>
              <p className="text-slate-500 text-[11px]">Enter device brand, title, RAM, storage, battery health, and prices in Naira.</p>
            </div>
            <div className="space-y-1">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] mb-2">3</span>
              <p className="font-bold text-slate-900">Upload &amp; Auto-Publish</p>
              <p className="text-slate-500 text-[11px]">Drop your file below. Our parser validates rows and consumes included credits.</p>
            </div>
          </div>

          {/* Drag & Drop Box */}
          <Card className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center hover:border-blue-500 transition shadow-xs">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Drag &amp; drop your product file here</h3>
                <p className="text-xs text-slate-400 mt-1">Supports CSV, XLS, or XLSX up to 10MB</p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" id="bulk-file" />
                <label htmlFor="bulk-file">
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-6 rounded-xl cursor-pointer">
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>
            </div>
          </Card>

          {/* Mock Validation Progress Preview */}
          <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">abuja_stock_update_oct.xlsx</p>
                  <p className="text-[11px] text-slate-400">4.2 MB • Processing completed</p>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-none text-xs font-bold">100% Validated</Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 45 Valid Products
                </div>
                <p className="text-[10px] text-emerald-700 mt-0.5">Ready to publish immediately</p>
              </div>

              <div className="p-3 bg-red-50/60 border border-red-200/70 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs font-black text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600" /> 3 Missing Prices
                </div>
                <p className="text-[10px] text-red-700 mt-0.5">Row 14, 22, 38 need Naira prices</p>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> 2 Category Warnings
                </div>
                <p className="text-[10px] text-amber-700 mt-0.5">Will map to "Other Technology"</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                <span>Skip invalid rows and publish valid devices automatically</span>
              </label>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl h-9">
                  Cancel
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9">
                  Publish 45 Products
                </Button>
              </div>
            </div>
          </Card>

          {/* Recent Uploads Table */}
          <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">Recent Upload History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-2">Filename</th>
                    <th className="pb-2">Results</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { file: 'iphones_banex_stock.csv', ok: 25, fail: 0, date: 'Oct 25, 2024' },
                    { file: 'laptops_inventory_q4.xlsx', ok: 42, fail: 3, date: 'Oct 24, 2024' },
                    { file: 'accessories_clearance.csv', ok: 100, fail: 0, date: 'Oct 20, 2024' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" /> {row.file}
                      </td>
                      <td className="py-3">
                        <span className="text-emerald-700 font-bold">{row.ok} published</span>
                        {row.fail > 0 && <span className="text-red-600 font-bold ml-1.5">• {row.fail} failed</span>}
                      </td>
                      <td className="py-3 text-slate-400">{row.date}</td>
                      <td className="py-3 text-right">
                        <button className="text-blue-600 font-bold hover:underline">View Log</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}