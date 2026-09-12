'use client'

import { useState } from 'react'
import { submitEnquiry } from '@/app/products/[id]/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Mail, CheckCircle2, Loader2 } from 'lucide-react'

interface EnquiryFormModalProps {
  productId: string
  sellerId: string
  productTitle: string
}

export function EnquiryFormModal({ productId, sellerId, productTitle }: EnquiryFormModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    formData.append('productId', productId)
    formData.append('sellerId', sellerId)

    const result = await submitEnquiry(formData)

    if (result?.error) {
      setErrorMessage(result.error)
      setLoading(false)
    } else {
      setLoading(false)
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setOpen(false)
      }, 2500)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 text-xs font-semibold h-11 border-slate-300">
          <Mail className="w-4 h-4 text-slate-500" /> Send On-Platform Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Send Enquiry to Seller
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Regarding: <span className="font-semibold text-slate-700">{productTitle}</span>
          </p>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-sm text-slate-900">Enquiry Sent Successfully</p>
            <p className="text-xs text-slate-500">
              The seller has received your message and contact details in their dashboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {errorMessage && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {errorMessage}
              </div>
            )}

            <div>
              <Label htmlFor="buyerName" className="text-xs">Your Full Name</Label>
              <Input id="buyerName" name="buyerName" placeholder="e.g. Amina Musa" required className="mt-1 h-9 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="buyerPhone" className="text-xs">Phone Number</Label>
                <Input id="buyerPhone" name="buyerPhone" type="tel" placeholder="080..." required className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <Label htmlFor="buyerEmail" className="text-xs">Email (Optional)</Label>
                <Input id="buyerEmail" name="buyerEmail" type="email" placeholder="name@email.com" className="mt-1 h-9 text-xs" />
              </div>
            </div>

            <div>
              <Label htmlFor="message" className="text-xs">Your Message / Questions</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Ask about battery health, pickup location, or current availability..."
                required
                rows={4}
                className="mt-1 text-xs"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-10 font-semibold">
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Sending...
                </>
              ) : (
                'Submit Enquiry'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}