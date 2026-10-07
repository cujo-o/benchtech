import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DeliveryExceptionModal } from './DeliveryExceptionModal'
import {
  toggleDeliveryOnlineStatus,
  acceptDeliveryJob,
  confirmPickup,
  verifyDeliveryCompletion,
} from '@/app/actions/delivery'
import {
  Truck,
  MapPin,
  Phone,
  Package,
  CheckCircle2,
  Clock,
  Wallet,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DeliveryPortalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/delivery')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isDelivery = profile?.is_delivery || profile?.role === 'delivery' || profile?.is_admin
  if (!isDelivery) {
    redirect('/feed')
  }

  // Fetch Jobs: Assigned to this driver & Available unassigned jobs in Abuja
  const [{ data: myJobs }, { data: availableJobs }] = await Promise.all([
    supabase
      .from('delivery_jobs')
      .select('*, order:orders(*)')
      .eq('delivery_person_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('delivery_jobs')
      .select('*, order:orders(*)')
      .eq('status', 'new')
      .is('delivery_person_id', null)
      .order('created_at', { ascending: false }),
  ])

  const activeJob = (myJobs || []).find((j) =>
    ['accepted', 'pickup_pending', 'in_transit'].includes(j.status)
  )
  const completedJobs = (myJobs || []).filter((j) => j.status === 'delivered')
  const openQueue = availableJobs || []

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Driver Status & Instant Earnings Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black">{profile.full_name || 'Delivery Partner'}</h1>
                <Badge
                  className={
                    profile.is_online ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                  }
                >
                  {profile.is_online ? 'Active • Online' : 'Offline'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                BenchTech Logistics Fleet • Abuja Central
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Available Earnings
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                ₦{Number(profile.delivery_earnings || 0).toLocaleString()}
              </span>
            </div>

            <form
              action={async () => {
                'use server'
                await toggleDeliveryOnlineStatus(!profile.is_online)
              }}
            >
              <Button
                size="sm"
                variant={profile.is_online ? 'outline' : 'default'}
                className="rounded-xl text-xs font-bold"
              >
                {profile.is_online ? 'Go Offline' : 'Go Online'}
              </Button>
            </form>
          </div>
        </div>

        {/* Active Delivery Workflow */}
        {activeJob ? (
          <div className="bg-linear-to-b from-blue-900 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl border border-blue-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h2 className="text-base font-black">Active Delivery #{activeJob.job_number}</h2>
              </div>
              <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full capitalize">
                Status: {activeJob.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-blue-300 font-bold uppercase block">
                  1. Pickup Address
                </span>
                <p className="font-bold text-white text-sm">{activeJob.pickup_address}</p>
                <p className="text-slate-300">Contact: {activeJob.pickup_phone}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-emerald-300 font-bold uppercase block">
                  2. Buyer Dropoff Address
                </span>
                <p className="font-bold text-white text-sm">{activeJob.dropoff_address}</p>
                <p className="text-slate-300">Contact: {activeJob.dropoff_phone}</p>
              </div>
            </div>

            {/* Workflow Controls: Pickup vs Complete Delivery */}
            <div className="pt-2 space-y-3">
              {activeJob.status === 'accepted' || activeJob.status === 'pickup_pending' ? (
                <form
                  action={async () => {
                    'use server'
                    await confirmPickup(activeJob.id)
                  }}
                >
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs h-11 rounded-xl shadow-md cursor-pointer">
                    Confirm Pickup from Seller → Start Transit
                  </Button>
                </form>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-blue-200">
                    Hand device to buyer for physical check. Request the 6-digit confirmation OTP
                    from the buyer to verify delivery and release your ₦
                    {Number(activeJob.delivery_partner_earning).toLocaleString()} earning immediately.
                  </p>
                  <form
                    action={async (formData: FormData) => {
                      'use server'
                      const otp = formData.get('otp') as string
                      await verifyDeliveryCompletion(activeJob.id, otp)
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      name="otp"
                      required
                      placeholder="Enter 6-digit Buyer OTP..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono font-bold"
                    />
                    <Button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-5 rounded-xl cursor-pointer"
                    >
                      Verify &amp; Release ₦
                      {Number(activeJob.delivery_partner_earning).toLocaleString()}
                    </Button>
                  </form>
                </div>
              )}

              {/* Exception Modal & Fee Info */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <DeliveryExceptionModal
                  jobId={activeJob.id}
                  jobNumber={activeJob.job_number}
                />
                <span className="text-[11px] text-blue-200">
                  Fee:{' '}
                  <strong>
                    ₦{Number(activeJob.delivery_partner_earning).toLocaleString()}
                  </strong>{' '}
                  upon verification
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
            <span>You have no active runs right now. Select an available job below to start.</span>
          </div>
        )}

        {/* Available Dispatch Radar Queue */}
        <div className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
            Available Jobs in Abuja
          </h2>

          {openQueue.length > 0 ? (
            openQueue.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs">{job.job_number}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {job.package_description}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    From <strong>{job.pickup_address}</strong> to{' '}
                    <strong>{job.dropoff_address}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    ₦{Number(job.delivery_partner_earning).toLocaleString()}
                  </span>
                  <form
                    action={async () => {
                      'use server'
                      await acceptDeliveryJob(job.id)
                    }}
                  >
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 px-4 cursor-pointer"
                    >
                      Accept Job
                    </Button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No new delivery requests waiting in queue.
            </div>
          )}
        </div>

        {/* Completed Deliveries History */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
            Completed Deliveries ({completedJobs.length})
          </h2>

          <div className="space-y-2">
            {completedJobs.map((j) => (
              <div
                key={j.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {j.job_number}
                  </span>
                  <span className="text-slate-400 ml-2">Delivered to {j.dropoff_district}</span>
                </div>
                <span className="font-black text-emerald-600">
                  +₦{Number(j.delivery_partner_earning).toLocaleString()} (Paid)
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}