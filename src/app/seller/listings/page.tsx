import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  toggleSellerListingStatus,
  deleteSellerListing,
} from './actions'
import {
  Boxes,
  Plus,
  Package,
  ShieldCheck,
  CheckCircle2,
  EyeOff,
  Eye,
  Trash2,
  Edit3,
  ExternalLink,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

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

export default async function SellerListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const activeTab = params?.status || 'all'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller/listings')
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const allListings = products || []

  const filteredListings = allListings.filter((item) => {
    if (activeTab === 'published') return item.status === 'published'
    if (activeTab === 'sold') return item.status === 'sold'
    if (activeTab === 'hidden') return item.status === 'hidden' || item.status === 'draft'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Product Listings
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your active electronics inventory, hardware specs, and stock statuses.
          </p>
        </div>

        <Link href="/seller/listings/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Add New Listing</span>
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All (${allListings.length})` },
          {
            id: 'published',
            label: `Active (${allListings.filter((i) => i.status === 'published').length})`,
          },
          {
            id: 'sold',
            label: `Sold (${allListings.filter((i) => i.status === 'sold').length})`,
          },
          {
            id: 'hidden',
            label: `Hidden (${
              allListings.filter((i) => i.status === 'hidden' || i.status === 'draft').length
            })`,
          },
        ].map((tab) => (
          <Link key={tab.id} href={`/seller/listings?status=${tab.id}`}>
            <button
              type="button"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Listings Grid */}
      {filteredListings.length > 0 ? (
        <div className="space-y-3">
          {filteredListings.map((item) => {
            const firstImg = resolveFirstImage(item.images)
            const hasSerial = Boolean(item.specs?.serial_masked || item.specs?.serial_number)
            const hasProof = Boolean(item.specs?.ownership_proof_url)
            const isPublished = item.status === 'published'
            const isSold = item.status === 'sold'

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                    {firstImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={firstImg}
                        alt={item.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/products/${item.id}`}
                        target="_blank"
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-md flex items-center gap-1"
                      >
                        <span className="truncate">{item.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                      </Link>

                      <Badge
                        className={`text-[10px] font-bold capitalize ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : isSold
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {item.status || 'published'}
                      </Badge>

                      {(hasSerial || hasProof) && (
                        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>
                            {hasProof ? 'Ownership & Serial Logged' : `SN: ${item.specs?.serial_masked}`}
                          </span>
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-black text-slate-900 dark:text-white">
                        ₦{Number(item.price || 0).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="capitalize">
                        {item.condition?.replace(/_/g, ' ') || 'Used'}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{item.category || 'Hardware'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                  <Link href={`/seller/listings/${item.id}/edit`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-bold rounded-xl h-9 px-3 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Button>
                  </Link>

                  {!isSold && (
                    <form
                      action={async () => {
                        'use server'
                        await toggleSellerListingStatus(item.id, 'sold')
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        className="text-xs font-bold rounded-xl h-9 px-3 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Sold</span>
                      </Button>
                    </form>
                  )}

                  <form
                    action={async () => {
                      'use server'
                      await toggleSellerListingStatus(
                        item.id,
                        isPublished ? 'hidden' : 'published'
                      )
                    }}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="text-xs font-bold rounded-xl h-9 px-3 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer"
                    >
                      {isPublished ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </>
                      )}
                    </Button>
                  </form>

                  <form
                    action={async () => {
                      'use server'
                      await deleteSellerListing(item.id)
                    }}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl h-9 px-2.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No product listings in this view
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Publish your phones, laptops, or consoles with verified specifications to start receiving orders in Abuja.
            </p>
          </div>
          <Link href="/seller/listings/new" className="inline-block pt-1">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5">
              Create First Listing
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}