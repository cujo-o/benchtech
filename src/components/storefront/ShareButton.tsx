'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check } from 'lucide-react'

interface ShareButtonProps {
  title?: string
  url?: string
  variant?: 'outline' | 'ghost' | 'default'
  className?: string
  compact?: boolean
}

export function ShareButton({
  title = 'Check out this gadget on BenchTech',
  url,
  variant = 'outline',
  className = '',
  compact = false,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        })
        return
      } catch {
        // Fallback to clipboard if user cancels or native share fails
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleShare}
        title={copied ? 'Link Copied!' : 'Share Device'}
        className={`p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 transition cursor-pointer shadow-2xs ${className}`}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Share2 className="w-3.5 h-3.5" />
        )}
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleShare}
      className={`text-xs font-bold rounded-xl h-10 px-4 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer transition ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 text-slate-500" />
          <span>Share</span>
        </>
      )}
    </Button>
  )
}