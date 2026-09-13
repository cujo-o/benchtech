'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductImageGalleryProps {
  images: string[]
  title: string
}

export function ProductImageGallery({ images = [], title }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const hasMultiple = images.length > 1

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  // Mobile Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    const distance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50

    if (distance > minSwipeDistance) {
      handleNext()
    } else if (distance < -minSwipeDistance) {
      handlePrev()
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 text-xs">
        No images available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Feature Viewport */}
      <div
        className="relative aspect-[4/3] w-full bg-slate-50 border border-slate-200/80 rounded-3xl overflow-hidden flex items-center justify-center select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Active Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[activeIndex]}
          alt={`${title} - view ${activeIndex + 1}`}
          className="w-full h-full object-contain p-4 transition-all duration-300"
        />

        {/* Floating Arrows (PC & Tablets) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Image"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md items-center justify-center transition hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Image"
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md items-center justify-center transition hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Mobile Swipe Pagination Dots */}
            <div className="absolute bottom-3 left-0 right-0 flex sm:hidden justify-center items-center gap-1.5 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Row (Desktop click selection) */}
      {hasMultiple && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 bg-white transition ${
                idx === activeIndex
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}