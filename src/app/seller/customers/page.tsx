import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProGate } from '@/components/seller/ProGate'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Search,
  Phone,
  Mail,
  ShoppingBag,
  MessageSquare,
  Calendar,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Customer Directory | BenchTech Seller',
}

interface CustomerRecord {
  id: string
  name: string
  phone: string
  email?: string
  totalOrders: number
  totalSpent: number
  lastContact: string
  type: 'paying_customer' | 'enquirer'
}

export default async function SellerCustomersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/customers')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 1. Fetch all enquiries for this seller
  const { data: enquiries } = await supabase
    .from('enquiries')
    .select('id, buyer_name, buyer_phone, created_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // 2. Fetch all orders for this seller
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount, created_at, buyer_id')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // Aggregate customer directory by phone/name
  const customerMap = new Map<string, CustomerRecord>()

  // Ingest enquiries
  ;(enquiries || []).forEach((enq) => {
    const key = (enq.buyer_phone || enq.buyer_name || enq.id).trim().toLowerCase()
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        id: enq.id,
        name: enq.buyer_name || 'Anonymous Buyer',
        phone: enq.buyer_phone || 'N/A',
        totalOrders: 0,
        totalSpent: 0,
        lastContact: enq.created_at,
        type: 'enquirer',
      })
    }
  })

  // Ingest orders
  ;(orders || []).forEach((ord) => {
    const key = ord.buyer_id || ord.id
    if (customerMap.has(key)) {
      const existing = customerMap.get(key)!
      existing.totalOrders += 1
      existing.totalSpent += Number(ord.total_amount) || 0
      existing.type = 'paying_customer'
    } else {
      customerMap.set(key, {
        id: ord.id,
        name: 'Verified Customer',
        phone: 'Available on Order',
        totalOrders: 1,
        totalSpent: Number(ord.total_amount) || 0,
        lastContact: ord.created_at,
        type: 'paying_customer',
      })
    }
  })

  const customersList = Array.from(customerMap.values())
  const totalCustomers = customersList.length
  const payingCustomers = customersList.filter((c) => c.type === 'paying_customer').length

  return (
    <ProGate
      profile={profile}
      featureTitle="Customer Directory & CRM"
      featureDescription="Manage relationships with buyers who have enquired or purchased devices from your Abuja storefront."
    >
      <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Customer Directory
              </h1>
              <Badge className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                Pro Feature
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Contact history, repeat order values, and customer communication records.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Contacts
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalCustomers}</p>
            <p className="text-[10px] text-slate-400">Enquiries &amp; buyers</p>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Paying Buyers
            </span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{payingCustomers}</p>
            <p className="text-[10px] text-emerald-600 font-semibold">Completed checkout orders</p>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Enquiries
            </span>
            <p className="text-2xl font-black text-blue-600 mt-1">
              {enquiries?.length || 0}
            </p>
            <p className="text-[10px] text-slate-400">Incoming device inquiries</p>
          </Card>
        </div>

        <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                placeholder="Search customers by name or phone..."
                className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Relationship</th>
                  <th className="pb-3">Orders</th>
                  <th className="pb-3">Total Spend</th>
                  <th className="pb-3 text-right">Last Interaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customersList.length > 0 ? (
                  customersList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                          {c.name[0]?.toUpperCase()}
                        </div>
                        <span>{c.name}</span>
                      </td>
                      <td className="py-3.5 text-slate-600 font-medium">
                        {c.phone !== 'N/A' ? (
                          <a href={`tel:${c.phone}`} className="hover:text-blue-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-3.5">
                        {c.type === 'paying_customer' ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            Paying Customer
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-50 text-blue-700 border-none text-[10px]">
                            Enquirer
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 font-bold text-slate-800">{c.totalOrders}</td>
                      <td className="py-3.5 font-black text-slate-900">
                        ₦{c.totalSpent.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-right text-slate-400">
                        {new Date(c.lastContact).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                      <Users className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-xs">No customer directory records yet.</p>
                      <p className="text-[11px] text-slate-400">
                        When buyers enquire about listings or make purchases, their contact profiles will aggregate here.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </ProGate>
  )
}