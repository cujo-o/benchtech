import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sendEnquiryReply } from '@/app/messages/actions'
import { updateEnquiryStatus } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Phone, Mail, MessageSquare, CheckCircle, Send } from 'lucide-react'

export default async function SellerEnquiriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller/enquiries')
  }

  // 1. Fetch enquiries belonging to this seller
  const { data: enquiries, error: enquiriesError } = await supabase
    .from('enquiries')
    .select('*, products(id, title, price, images)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (enquiriesError) {
    console.error('Error fetching seller enquiries:', enquiriesError.message)
  }

  // 2. Fetch replies for these enquiries separately to avoid join crashes
  const enquiryIds = enquiries?.map((e) => e.id) || []
  let replies: any[] = []

  if (enquiryIds.length > 0) {
    const { data: repliesData, error: repliesError } = await supabase
      .from('enquiry_replies')
      .select('*')
      .in('enquiry_id', enquiryIds)
      .order('created_at', { ascending: true })

    if (!repliesError && repliesData) {
      replies = repliesData
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Buyer Inquiries & Conversations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Chat with prospective buyers and manage active store leads.
        </p>
      </div>

      {enquiries && enquiries.length > 0 ? (
        <div className="space-y-6">
          {enquiries.map((item) => {
            const threadReplies = replies.filter((r) => r.enquiry_id === item.id)

            return (
              <Card key={item.id} className="border border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  {/* Buyer & Product Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{item.buyer_name}</h3>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] uppercase font-bold ${
                            item.status === 'new'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : item.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {item.buyer_phone}
                        </span>
                        {item.buyer_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {item.buyer_email}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.products && (
                      <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs">
                        <div className="w-9 h-9 rounded-lg bg-white overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                          {item.products.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.products.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] text-slate-400">No Image</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 line-clamp-1 max-w-[180px]">{item.products.title}</p>
                          <p className="text-blue-600 font-bold">₦{Number(item.price || item.products.price).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conversation Thread */}
                  <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-100 max-h-80 overflow-y-auto">
                    {/* Initial Enquiry Message */}
                    <div className="flex flex-col items-start">
                      <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 max-w-[85%] shadow-sm">
                        <p className="text-[10px] font-bold text-slate-500 mb-0.5">{item.buyer_name} (Initial Inquiry)</p>
                        <p className="text-xs text-slate-800 leading-relaxed">{item.message}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 ml-1">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Replies */}
                    {threadReplies.map((reply) => {
                      const isMe = reply.sender_id === user.id
                      return (
                        <div key={reply.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 max-w-[85%] shadow-sm ${
                              isMe ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200/80 text-slate-800'
                            }`}
                          >
                            <p className={`text-[10px] font-bold mb-0.5 ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>
                              {isMe ? 'You (Store)' : item.buyer_name}
                            </p>
                            <p className="text-xs leading-relaxed">{reply.message}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1 px-1">
                            {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Reply Input & Status Toggle */}
                  <div className="space-y-3 pt-2">
                    <form
                      action={async (formData) => {
                        'use server'
                        const msg = formData.get('sellerReply') as string
                        if (msg?.trim()) {
                          await sendEnquiryReply(item.id, msg)
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Input
                        name="sellerReply"
                        placeholder="Type reply to buyer..."
                        required
                        className="h-10 text-xs bg-white border-slate-200 flex-1"
                      />
                      <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 h-10 px-4 text-xs font-bold gap-1">
                        <Send className="w-3.5 h-3.5" /> Reply
                      </Button>
                    </form>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-400 text-[11px]">Conversation status:</span>
                      <div className="flex items-center gap-2">
                        {item.status !== 'resolved' && (
                          <form action={updateEnquiryStatus.bind(null, item.id, 'resolved')}>
                            <Button size="sm" variant="outline" className="text-xs h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-600 font-medium text-sm">No inquiries received yet</p>
        </div>
      )}
    </div>
  )
}