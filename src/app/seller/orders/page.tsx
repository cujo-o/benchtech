import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrderStatusTracker } from '@/components/orders/OrderStatusTracker'
import { updateOrderStatus, OrderStatus } from '@/app/actions/orders'
import { Button } from '@/components/ui/button'
import { MapPin, User, Calendar, Check, Truck, X } from 'lucide-react'

export const metadata = {
  title: 'Order Requests | BenchTech Seller',
}

export default async function SellerOrdersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller/orders')
  }

  // Fetch incoming buying requests with product and buyer details
  const { data: requests } = await supabase
    .from('buying_requests')
    .select(`
      *,
      products (id, title, price, images),
      profiles!buying_requests_buyer_id_fkey (full_name, phone)
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Orders & Buying Requests
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Coordinate gadget availability, pickup inspection, and delivery fulfillment with buyers in Abuja.
        </p>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-2">
          <p className="text-sm font-bold text-slate-800">No buying requests yet.</p>
          <p className="text-xs text-slate-400">
            Incoming purchase expressions for your published items will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((order: any) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
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
                    <h3 className="font-bold text-sm text-slate-900">{order.products?.title}</h3>
                    <p className="text-xs font-black text-blue-600 mt-0.5">
                      ₦{Number(order.agreed_price).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.profiles?.full_name || 'Buyer'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.delivery_area || 'Abuja'}</span>
                  </div>
                </div>
              </div>

              {/* Status Stepper */}
              <OrderStatusTracker currentStatus={order.status} />

              {/* Action Controls for Seller */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-400 font-medium capitalize">
                  Fulfillment: {order.delivery_method.replace('_', ' ')}
                </span>

                <div className="flex items-center gap-2">
                  {order.status === 'new_request' && (
                    <form
                      action={async () => {
                        'use server'
                        await updateOrderStatus(order.id, 'confirmed')
                      }}
                    >
                      <Button size="sm" className="h-9 rounded-xl bg-blue-600 text-xs font-bold gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Confirm Availability
                      </Button>
                    </form>
                  )}

                  {order.status === 'confirmed' && (
                    <form
                      action={async () => {
                        'use server'
                        await updateOrderStatus(
                          order.id,
                          order.delivery_method === 'pickup' ? 'ready_for_pickup' : 'dispatched'
                        )
                      }}
                    >
                      <Button size="sm" className="h-9 rounded-xl bg-indigo-600 text-xs font-bold gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        {order.delivery_method === 'pickup'
                          ? 'Mark Ready for Pickup'
                          : 'Mark Dispatched'}
                      </Button>
                    </form>
                  )}

                  {(order.status === 'ready_for_pickup' || order.status === 'dispatched') && (
                    <form
                      action={async () => {
                        'use server'
                        await updateOrderStatus(order.id, 'completed')
                      }}
                    >
                      <Button size="sm" className="h-9 rounded-xl bg-emerald-600 text-xs font-bold gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Complete Order
                      </Button>
                    </form>
                  )}

                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <form
                      action={async () => {
                        'use server'
                        await updateOrderStatus(order.id, 'cancelled')
                      }}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 rounded-xl text-xs text-red-600 hover:bg-red-50 font-bold"
                      >
                        Cancel
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}