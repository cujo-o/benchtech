import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateSellerListingAction } from './actions'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EditSellerListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('seller_id', user.id)
    .maybeSingle()

  if (!product) notFound()

  async function handleFormAction(formData: FormData): Promise<void> {
    'use server'
    await updateSellerListingAction(formData)
    redirect('/seller/listings')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <Link
          href="/seller/listings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Listings</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Edit Product Listing
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Update pricing, stock quantity, and hardware specifications.
        </p>
      </div>

      <form
        action={handleFormAction}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5 text-xs"
      >
        <input type="hidden" name="productId" value={product.id} />

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Product Title
          </label>
          <input
            type="text"
            name="title"
            defaultValue={product.title}
            required
            className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Brand
            </label>
            <input
              type="text"
              name="brand"
              defaultValue={product.brand || ''}
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Model
            </label>
            <input
              type="text"
              name="model"
              defaultValue={product.model || product.specs?.model || ''}
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Condition
            </label>
            <select
              name="condition"
              defaultValue={product.condition || 'uk_used'}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            >
              <option value="brand_new">Brand New (Sealed)</option>
              <option value="open_box">Open Box</option>
              <option value="uk_used">Foreign Used (Clean)</option>
              <option value="fairly_used">Direct Used</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Price (₦)
            </label>
            <input
              type="number"
              name="price"
              defaultValue={product.price}
              required
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Stock Quantity
            </label>
            <input
              type="number"
              name="quantity"
              min={1}
              defaultValue={product.stock_quantity || 1}
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <input
              type="text"
              name="category"
              defaultValue={product.category || 'phones'}
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            />
          </div>
        </div>

        {/* Hardware Specifications */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Storage
            </label>
            <input
              type="text"
              name="storage"
              defaultValue={product.specs?.storage || ''}
              placeholder="e.g. 256GB"
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              RAM
            </label>
            <input
              type="text"
              name="ram"
              defaultValue={product.specs?.ram || ''}
              placeholder="e.g. 16GB"
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Battery Health
            </label>
            <input
              type="text"
              name="batteryHealth"
              defaultValue={product.specs?.battery_health || ''}
              placeholder="e.g. 92%"
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              IMEI / Serial
            </label>
            <input
              type="text"
              name="serialOrImei"
              defaultValue={product.specs?.serial_number || ''}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Description &amp; Condition Notes
          </label>
          <textarea
            name="description"
            rows={4}
            defaultValue={product.description || ''}
            required
            className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-6 gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </Button>
        </div>
      </form>
    </div>
  )
}