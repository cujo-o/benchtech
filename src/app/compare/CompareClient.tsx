'use client'

import Link from 'next/link'
import { useCompareStore } from '@/lib/store/useCompareStore'
import { formatSpecLabel } from '@/lib/specs/categorySpecs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { Scale, X, Plus, Trash2, ExternalLink, Package } from 'lucide-react'

function resolveFirstImage(images: any): string | null {
  if (!images) return null
  if (Array.isArray(images)) return images[0] || null
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) return parsed[0] || null
    } catch {
      return images.startsWith('http') ? images : null
    }
  }
  return null
}

function parseProductSpecs(specs: any): Record<string, string> {
  if (!specs) return {}
  if (typeof specs === 'object' && !Array.isArray(specs)) {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(specs)) {
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        out[k] = String(v)
      }
    }
    return out
  }
  if (typeof specs === 'string') {
    try {
      return parseProductSpecs(JSON.parse(specs))
    } catch {
      return {}
    }
  }
  return {}
}

export function CompareClient({
  initialProducts = [],
}: {
  initialProducts?: any[]
}) {
  const { items: storeItems, removeItem, clearCompare } = useCompareStore()

  // Merge store items with server-loaded items so full database specs are always present
  const products =
    initialProducts.length > 0
      ? initialProducts
      : storeItems

  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <Scale className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            No Devices Selected for Comparison
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select up to 4 products from the catalog or your seller listings to compare every technical specification side by side.
          </p>
        </div>
        <Link href="/products" className="inline-block">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-6">
            Browse Products to Compare
          </Button>
        </Link>
      </div>
    )
  }

  // Dynamically collect EVERY spec key present on any of the compared products
  const allSpecKeysSet = new Set<string>()
  const parsedSpecsByProduct = new Map<string, Record<string, string>>()

  for (const prod of products) {
    const parsed = parseProductSpecs(prod.specs || prod.specifications)
    // Also surface top-level hardware columns if present
    if (prod.storage && !parsed.storage) parsed.storage = String(prod.storage)
    if (prod.ram && !parsed.ram) parsed.ram = String(prod.ram)
    if (prod.battery_health && !parsed.battery_health)
      parsed.battery_health = String(prod.battery_health)
    if (prod.processor && !parsed.processor)
      parsed.processor = String(prod.processor)

    parsedSpecsByProduct.set(prod.id, parsed)
    Object.keys(parsed).forEach((k) => allSpecKeysSet.add(k))
  }

  const allSpecKeys = Array.from(allSpecKeysSet)

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Side-by-Side Hardware Comparison
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Comparing {products.length} of 4 maximum devices across all recorded specifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/products">
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold rounded-xl h-9 border-slate-200 dark:border-slate-700 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Device
            </Button>
          </Link>
          {storeItems.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearCompare}
              className="text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl h-9 gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Tray
            </Button>
          )}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="p-4 sm:p-5 w-44 bg-slate-50/70 dark:bg-slate-800/40 font-black uppercase text-[10px] tracking-wider text-slate-400 align-top">
                Device Overview
              </th>
              {products.map((prod) => {
                const img = resolveFirstImage(prod.images)
                return (
                  <th
                    key={prod.id}
                    className="p-4 sm:p-5 min-w-[200px] max-w-[260px] align-top border-l border-slate-100 dark:border-slate-800"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-[4/3] w-full rounded-2xl bg-slate-100 dark:bg-slate-800 p-3 flex items-center justify-center overflow-hidden">
                        <button
                          type="button"
                          onClick={() => removeItem(prod.id)}
                          title="Remove from comparison"
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-500 hover:text-red-600 flex items-center justify-center shadow-2xs cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt={prod.title}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold">
                          {prod.category || 'Hardware'}
                        </Badge>
                        <Link
                          href={`/products/${prod.id}`}
                          className="font-black text-sm text-slate-900 dark:text-white hover:text-blue-600 line-clamp-2 block"
                        >
                          {prod.title}
                        </Link>
                        <p className="text-base font-black text-blue-600 dark:text-blue-400">
                          ₦{Number(prod.price || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <AddToCartButton product={prod} variant="full" />
                        <Link href={`/products/${prod.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 px-2.5 rounded-xl border-slate-200 dark:border-slate-700"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Core Universal Rows */}
            <tr>
              <td className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40 font-bold text-slate-500 dark:text-slate-400">
                Brand
              </td>
              {products.map((prod) => (
                <td
                  key={prod.id}
                  className="p-3.5 sm:p-4 font-bold text-slate-900 dark:text-white border-l border-slate-100 dark:border-slate-800"
                >
                  {prod.brand || '—'}
                </td>
              ))}
            </tr>

            <tr>
              <td className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40 font-bold text-slate-500 dark:text-slate-400">
                Model
              </td>
              {products.map((prod) => (
                <td
                  key={prod.id}
                  className="p-3.5 sm:p-4 font-semibold text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800"
                >
                  {prod.model || parsedSpecsByProduct.get(prod.id)?.model || '—'}
                </td>
              ))}
            </tr>

            <tr>
              <td className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40 font-bold text-slate-500 dark:text-slate-400">
                Condition
              </td>
              {products.map((prod) => (
                <td
                  key={prod.id}
                  className="p-3.5 sm:p-4 capitalize font-bold text-emerald-600 dark:text-emerald-400 border-l border-slate-100 dark:border-slate-800"
                >
                  {prod.condition?.replace(/_/g, ' ') || 'Used'}
                </td>
              ))}
            </tr>

            <tr>
              <td className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40 font-bold text-slate-500 dark:text-slate-400">
                Abuja Location
              </td>
              {products.map((prod) => (
                <td
                  key={prod.id}
                  className="p-3.5 sm:p-4 text-slate-700 dark:text-slate-300 border-l border-slate-100 dark:border-slate-800"
                >
                  {prod.location || prod.profiles?.district || 'Abuja'}
                </td>
              ))}
            </tr>

            {/* Dynamic Complete Spec Rows Across All Compared Products */}
            {allSpecKeys.map((specKey) => (
              <tr key={specKey}>
                <td className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40 font-bold text-slate-500 dark:text-slate-400">
                  {formatSpecLabel(specKey)}
                </td>
                {products.map((prod) => {
                  const val = parsedSpecsByProduct.get(prod.id)?.[specKey]
                  return (
                    <td
                      key={prod.id}
                      className="p-3.5 sm:p-4 font-semibold text-slate-900 dark:text-slate-100 border-l border-slate-100 dark:border-slate-800"
                    >
                      {val || <span className="text-slate-400 font-normal">—</span>}
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* Full Description Row so no important detail is left out */}
            <tr>
              <td className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40 font-bold text-slate-500 dark:text-slate-400 align-top">
                Key Details &amp; Summary
              </td>
              {products.map((prod) => (
                <td
                  key={prod.id}
                  className="p-3.5 sm:p-4 text-slate-600 dark:text-slate-300 leading-relaxed border-l border-slate-100 dark:border-slate-800 align-top whitespace-pre-line"
                >
                  {prod.description || '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}