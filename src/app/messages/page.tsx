import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { BuyerSidebar } from "@/components/storefront/BuyerSidebar";
import { sendEnquiryReply } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Store, Clock, ExternalLink, Send } from "lucide-react";
import { ThreadPoller } from "@/components/ThreadPoller";

export default async function BuyerMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/messages");
  }

  // Fetch enquiries with their threaded replies and product/seller relations
  const { data: enquiries } = await supabase
    .from("enquiries")
    .select(
      `
      *,
      products(id, title, price, images, brand),
      profiles!enquiries_seller_id_fkey(business_name, city, tech_trust_status, avatar_url),
      enquiry_replies(*, profiles!enquiry_replies_sender_id_fkey(full_name, business_name))
    `,
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  // Inside src/app/messages/page.tsx (after fetching enquiries):
  const enquiryIds = enquiries?.map((e: any) => e.id) || [];

  if (enquiryIds.length > 0 && user) {
    // Mark all unread replies sent by vendors as read for this buyer
    await supabase
      .from("enquiry_replies")
      .update({ is_read: true })
      .in("enquiry_id", enquiryIds)
      .neq("sender_id", user.id)
      .eq("is_read", false);
  }

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-6 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Conversations & Inquiries
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Chat directly with gadget vendors across Abuja.
            </p>
          </div>

          {enquiries && enquiries.length > 0 ? (
            <div className="space-y-6 max-w-4xl">
              {enquiries.map((item) => {
                // Sort replies chronologically
                const sortedReplies =
                  item.enquiry_replies?.sort(
                    (a: any, b: any) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime(),
                  ) || [];

                return (
                  <Card
                    key={item.id}
                    className="border border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-2xl"
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Header: Seller & Product */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-xs">
                            {item.profiles?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.profiles.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Store className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900">
                              {item.profiles?.business_name || "Tech Vendor"}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {item.profiles?.city || "Abuja"}
                            </span>
                          </div>
                        </div>

                        {item.products && (
                          <Link
                            href={`/products/${item.products.id}`}
                            className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 hover:bg-slate-100 transition"
                          >
                            <span className="text-xs font-bold text-slate-800 line-clamp-1">
                              {item.products.title}
                            </span>
                            <span className="text-xs font-black text-blue-600">
                              ₦{Number(item.products.price).toLocaleString()}
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>
                        )}
                      </div>

                      {/* Conversation Thread */}
                      <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-100 max-h-80 overflow-y-auto">
                        {/* Initial Enquiry Message */}
                        <div className="flex flex-col items-start">
                          <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 max-w-[85%] shadow-sm">
                            <p className="text-[10px] font-bold text-blue-600 mb-0.5">
                              You (Initial Inquiry)
                            </p>
                            <p className="text-xs text-slate-800 leading-relaxed">
                              {item.message}
                            </p>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1 ml-1">
                            {new Date(item.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Threaded Replies */}
                        {sortedReplies.map((reply: any) => {
                          const isMe = reply.sender_id === user.id;
                          return (
                            <div
                              key={reply.id}
                              className={`flex flex-col ${isMe ? "items-start" : "items-end"}`}
                            >
                              <div
                                className={`rounded-2xl px-4 py-2.5 max-w-[85%] shadow-sm ${
                                  isMe
                                    ? "bg-white border border-slate-200/80 text-slate-800"
                                    : "bg-blue-600 text-white"
                                }`}
                              >
                                <p
                                  className={`text-[10px] font-bold mb-0.5 ${isMe ? "text-blue-600" : "text-blue-100"}`}
                                >
                                  {isMe
                                    ? "You"
                                    : item.profiles?.business_name || "Vendor"}
                                </p>
                                <p className="text-xs leading-relaxed">
                                  {reply.message}
                                </p>
                              </div>
                              <span className="text-[9px] text-slate-400 mt-1 px-1">
                                {new Date(reply.created_at).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply Input Form */}
                      <form
                        action={async (formData) => {
                          "use server";
                          const msg = formData.get("replyMessage") as string;
                          if (msg?.trim()) {
                            await sendEnquiryReply(item.id, msg);
                          }
                        }}
                        className="flex items-center gap-2 pt-1"
                      >
                        <Input
                          name="replyMessage"
                          placeholder="Type your reply..."
                          required
                          className="h-10 text-xs bg-white border-slate-200 flex-1"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 h-10 px-4 text-xs font-bold gap-1"
                        >
                          <Send className="w-3.5 h-3.5" /> Send
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                );
              })}
              <ThreadPoller intervalMs={5000} />
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 max-w-xl">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">
                No Conversations Yet
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Browse products and send an inquiry to start chatting with
                verified vendors.
              </p>
              <Link href="/products" className="inline-block mt-4">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-xs font-bold"
                >
                  Browse Gadgets
                </Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
