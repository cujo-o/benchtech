import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { OrderStatusTracker } from '@/components/orders/OrderStatusTracker'
import { Button } from '@/components/ui/button'
import { MapPin, Store, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Orders & Requests | BenchTech Abuja',
}

export default async function BuyerOrdersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/orders')
  }

  const { data: orders } = await supabase
    .from('buying_requests')
    .select(`
      *,
      products (id, title, price, images),
      profiles!buying_requests_seller_id_fkey (business_name, full_name, phone)
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-1">
              <Link
                href="/feed"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
              </Link>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                My Gadget Requests
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track device inspection and pickup progress with Abuja merchants.
              </p>
            </div>

            {!orders || orders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-2xs">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  You haven&apos;t submitted any requests yet.
                </p>
                <p className="text-xs text-slate-400">
                  Browse published gadgets to express buying interest.
                </p>
                <Link href="/feed">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl mt-2">
                    Explore Gadgets
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                          {order.products?.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={order.products.images[0]}
                              alt={order.products.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">
                              Gadget
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {order.products?.title}
                          </h3>
                          <div className="text-xs font-black text-blue-600 mt-0.5">
                            ₦{Number(order.agreed_price).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 sm:text-right">
                        <div className="font-bold text-slate-700 dark:text-slate-300 flex sm:justify-end items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {order.profiles?.business_name ||
                              order.profiles?.full_name ||
                              'Verified Vendor'}
                          </span>
                        </div>
                        <div className="flex sm:justify-end items-center gap-1 text-[11px] text-slate-400">
                          <MapPin className="w-3 h-3" />
                          <span>{order.delivery_area || 'Abuja'}</span>
                        </div>
                      </div>
                    </div>

                    <OrderStatusTracker currentStatus={order.status} />

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>
                        Method:{' '}
                        <strong className="capitalize text-slate-700 dark:text-slate-300">
                          {order.delivery_method?.replace('_', ' ')}
                        </strong>
                      </span>
                      <span className="text-[11px]">
                        Requested:{' '}
                        {new Date(order.created_at).toLocaleDateString('en-NG')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}