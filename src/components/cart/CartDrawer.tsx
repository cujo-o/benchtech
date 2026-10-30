'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/useCartStore'
import { Button } from '@/components/ui/button'
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react'

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotalItems,
  } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const subtotal = getSubtotal()
  const count = getTotalItems()

  const drawerContent = (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Full-Height Slide-Over Panel */}
      <aside className="relative z-[10000] w-full max-w-md h-dvh bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        {/* 1. Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Shopping Cart ({count} {count === 1 ? 'item' : 'items'})
              </h3>
              <p className="text-[11px] text-slate-400">
                {items.length} unique {items.length === 1 ? 'product' : 'products'} selected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] font-bold text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg transition cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Cart"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Scrollable Cart Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Your cart is empty
                </p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Add verified phones, laptops, or consoles from Abuja stores to begin checkout.
                </p>
              </div>
              <Link href="/products" onClick={() => setIsOpen(false)}>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl mt-2 h-9 px-4 cursor-pointer"
                >
                  Browse Catalog
                </Button>
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const unitPrice = Number(item.price || 0)
              const lineTotal = unitPrice * item.quantity

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex gap-3.5 items-start"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${item.id}`}
                    onClick={() => setIsOpen(false)}
                    className="w-18 h-18 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center p-1.5"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </Link>

                  {/* Item Details & Quantity Controls */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.id}`}
                          onClick={() => setIsOpen(false)}
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                          {item.condition?.replace(/_/g, ' ') || 'Verified Hardware'}
                          {item.quantity > 1
                            ? ` • ₦${unitPrice.toLocaleString()} each`
                            : ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0 cursor-pointer"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        ₦{lineTotal.toLocaleString()}
                      </span>

                      {/* Increase / Decrease Quantity */}
                      <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-slate-900 dark:text-white min-w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 3. Drawer Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5 shrink-0">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Total Items</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {count} {count === 1 ? 'unit' : 'units'}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Abuja Inspection / Escrow</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  7-Day Protection Included
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="block"
            >
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer">
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Verified Abuja stores • Handover OTP protection</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
        title="Shopping Cart"
        aria-label="Shopping Cart"
      >
        <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        {mounted && count > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && mounted ? createPortal(drawerContent, document.body) : null}
    </>
  )
}