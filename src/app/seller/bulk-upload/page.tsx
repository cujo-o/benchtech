'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
  ArrowRight,
  Package,
} from 'lucide-react'

export default function BulkUploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [validRows, setValidRows] = useState<any[]>([])
  const [invalidRows, setInvalidRows] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [successCount, setSuccessCount] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Download a real CSV template
  const downloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'title,brand,category,price,condition,stock,description\n' +
      'iPhone 13 128GB,Apple,phones,380000,open_box,1,Clean UK used iPhone with 88% battery health\n' +
      'HP EliteBook 840 G6,HP,laptops,285000,used,2,Core i5 8th Gen 16GB RAM 256GB SSD'

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'benchtech_product_import_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Parse CSV File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setSuccessCount(null)
    setErrorMsg(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length < 2) {
        setErrorMsg('CSV must contain a header row and at least one product row.')
        return
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
      const rows: any[] = []
      const valid: any[] = []
      const invalid: any[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim())
        const rowData: Record<string, any> = {}

        headers.forEach((h, idx) => {
          rowData[h] = values[idx] || ''
        })

        // Validation
        const hasTitle = Boolean(rowData.title)
        const priceNum = Number(rowData.price)
        const hasPrice = !isNaN(priceNum) && priceNum > 0
        const hasCategory = Boolean(rowData.category)

        if (hasTitle && hasPrice && hasCategory) {
          valid.push({
            title: rowData.title,
            brand: rowData.brand || 'Device',
            category: rowData.category.toLowerCase(),
            price: priceNum,
            condition: rowData.condition || 'used',
            stock: Number(rowData.stock) || 1,
            description: rowData.description || '',
            status: 'published',
          })
        } else {
          invalid.push({
            rowNumber: i + 1,
            data: rowData,
            reason: !hasTitle
              ? 'Missing product title'
              : !hasPrice
              ? 'Invalid or missing price'
              : 'Missing category',
          })
        }
        rows.push(rowData)
      }

      setParsedRows(rows)
      setValidRows(valid)
      setInvalidRows(invalid)
    }

    reader.readAsText(selected)
  }

  // Upload valid products to Supabase
  const handleUpload = async () => {
    if (validRows.length === 0) return

    setUploading(true)
    setErrorMsg(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Please log in to upload listings.')
      }

      const rowsToInsert = validRows.map((r) => ({
        ...r,
        seller_id: user.id,
      }))

      const { data, error } = await supabase.from('products').insert(rowsToInsert).select()

      if (error) throw error

      setSuccessCount(data?.length || validRows.length)
      setFile(null)
      setValidRows([])
      setInvalidRows([])
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to insert products.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
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
            Import multiple gadgets directly into your active Abuja inventory using CSV.
          </p>
        </div>

        <Button
          onClick={downloadTemplate}
          variant="outline"
          className="border-slate-200 text-slate-700 font-bold text-xs h-10 rounded-xl gap-2 hover:bg-slate-50"
        >
          <Download className="w-4 h-4 text-blue-600" /> Download CSV Template
        </Button>
      </div>

      {successCount !== null && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Successfully imported {successCount} products into your live inventory!</span>
          </div>
          <Link href="/seller/listings">
            <Button size="sm" variant="ghost" className="text-xs text-emerald-700 h-8">
              View In Listings &rarr;
            </Button>
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* File Dropzone */}
      <Card className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center hover:border-blue-500 transition shadow-xs">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              {file ? file.name : 'Select a CSV file to import products'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports standard formatted .csv files with headers
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="bulk-file-input"
            />
            <label htmlFor="bulk-file-input">
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-6 rounded-xl cursor-pointer"
              >
                <span>{file ? 'Choose Different File' : 'Browse Files'}</span>
              </Button>
            </label>
          </div>
        </div>
      </Card>

      {/* File Validation Results */}
      {file && (
        <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">{file.name}</p>
                <p className="text-[11px] text-slate-400">{parsedRows.length} total rows parsed</p>
              </div>
            </div>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-bold">
              {validRows.length} Valid
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-900">{validRows.length} Products Ready</span>
                <p className="text-emerald-700 text-[11px]">Valid title, price, and category</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-amber-900">{invalidRows.length} Rows Skipped</span>
                <p className="text-amber-700 text-[11px]">Missing required price or title</p>
              </div>
            </div>
          </div>

          {invalidRows.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <p className="font-bold text-slate-700 text-[11px] uppercase">Validation Warnings:</p>
              {invalidRows.slice(0, 3).map((inv, idx) => (
                <p key={idx} className="text-slate-500 text-[11px]">
                  • Row {inv.rowNumber}: {inv.reason}
                </p>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button
              onClick={() => {
                setFile(null)
                setValidRows([])
                setInvalidRows([])
              }}
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={validRows.length === 0 || uploading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Importing to Database...
                </>
              ) : (
                <>
                  Import {validRows.length} Products Now <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}