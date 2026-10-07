import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Truck,
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Search,
  User,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDeliveriesManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const params = await searchParams
  const statusFilter = params?.status || 'all'
  const searchQuery = (params?.q || '').toLowerCase().trim()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/deliveries')

  let query = supabase
    .from('delivery_jobs')
    .select(`
      *,
      order:orders(*),
      seller:profiles!delivery_jobs_seller_id_fkey(business_name, full_name, district, phone),
      buyer:profiles!delivery_jobs_buyer_id_fkey(full_name, phone, district),
      driver:profiles!delivery_jobs_delivery_person_id_fkey(full_name, phone, vehicle_type)
    `)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: jobs } = await query
  const allJobs = jobs || []

  const filteredJobs = searchQuery
    ? allJobs.filter(
        (j) =>
          j.job_number.toLowerCase().includes(searchQuery) ||
          j.package_description?.toLowerCase().includes(searchQuery) ||
          j.driver?.full_name?.toLowerCase().includes(searchQuery) ||
          j.seller?.business_name?.toLowerCase().includes(searchQuery)
      )
    : allJobs

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-black">Logistics &amp; Delivery Evidence Chain</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit pickup evidence, live transit tracking, OTP verification, and instant driver earnings in Abuja.
          </p>
        </div>

        <form method="GET" action="/admin/deliveries" className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={params?.q || ''}
            placeholder="Search job #, driver, package..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          />
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[
          { id: 'all', label: `All Deliveries (${allJobs.length})` },
          { id: 'new', label: 'Unassigned / Queue' },
          { id: 'in_transit', label: 'In Transit' },
          { id: 'delivered', label: 'Delivered & Verified' },
          { id: 'failed', label: 'Exceptions / Failed' },
        ].map((tab) => (
          <a key={tab.id} href={`/admin/deliveries?status=${tab.id}`}>
            <button
              type="button"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          </a>
        ))}
      </div>

      {/* Deliveries Audit Table */}
      <div className="space-y-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => {
            const isDelivered = job.status === 'delivered'
            const driverPaid = job.payout_status === 'payable' || job.payout_status === 'paid'

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4"
              >
                {/* Top Row: Job Number, Status & Order Link */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm">{job.job_number}</span>
                    <span className="text-slate-400">•</span>
                    <Badge
                      className={`text-[10px] font-bold capitalize ${
                        isDelivered
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : job.status === 'in_transit'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Order:</span>
                    <Link
                      href={`/orders/${job.order_id}`}
                      className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      #{job.order?.order_number || job.order_id.slice(0, 8)}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* 4-Column Operational Evidence Chain (Spec §25) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* 1. Seller Pickup Station */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      1. Seller Pickup
                    </span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {job.seller?.business_name || job.seller?.full_name || 'Vendor'}
                    </p>
                    <p className="text-slate-500 text-[11px] truncate">{job.pickup_address}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{job.pickup_phone}</p>
                  </div>

                  {/* 2. Assigned Delivery Driver */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      2. Delivery Driver
                    </span>
                    {job.driver ? (
                      <>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{job.driver.full_name}</p>
                        <p className="text-slate-500 text-[11px]">{job.driver.phone}</p>
                        <Badge variant="outline" className="text-[9px] capitalize">
                          {job.driver.vehicle_type || 'Motorcycle'}
                        </Badge>
                      </>
                    ) : (
                      <p className="text-amber-600 font-bold">Unassigned in Queue</p>
                    )}
                  </div>

                  {/* 3. Buyer Dropoff Destination */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      3. Buyer Destination
                    </span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {job.buyer?.full_name || 'Buyer'}
                    </p>
                    <p className="text-slate-500 text-[11px] truncate">{job.dropoff_address}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{job.dropoff_phone}</p>
                  </div>

                  {/* 4. Financial Status: Driver Payout vs Seller Escrow */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      4. Financial Settlements
                    </span>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Driver Earning:</span>
                      <span className="font-bold text-emerald-600">
                        ₦{Number(job.delivery_partner_earning).toLocaleString()} ({driverPaid ? 'Released' : 'Pending'})
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Seller Escrow:</span>
                      <span className="font-bold text-blue-600">
                        {isDelivered ? '7-Day Protection Hold' : 'Awaiting Delivery'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evidence & Verification Strip */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    {job.delivery_otp && (
                      <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        OTP: {job.delivery_otp}
                      </span>
                    )}
                    {job.delivered_at && (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Delivered on {new Date(job.delivered_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                      </span>
                    )}
                  </div>

                  {job.delivery_proof_url && (
                    <a
                      href={job.delivery_proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                    >
                      View Delivery Proof Photo <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No delivery records found matching this view.
          </div>
        )}
      </div>
    </div>
  )
}