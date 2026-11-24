'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  adminToggleUserCapability,
  type UserCapabilityFlag,
} from '@/app/admin/actions'
import {
  MoreVertical,
  ShieldAlert,
  Store,
  Truck,
  User,
  ShieldCheck,
  Crown,
  Ban,
  Loader2,
  X,
} from 'lucide-react'

interface UserActionsMenuProps {
  userId: string
  currentAdminId: string | null
  displayName: string
  email: string
  isAdmin: boolean
  isSeller: boolean
  isDeliverer: boolean
  isVerified: boolean
  isPro: boolean
  isSuspended: boolean
}

export function UserActionsMenu({
  userId,
  currentAdminId,
  displayName,
  email,
  isAdmin,
  isSeller,
  isDeliverer,
  isVerified,
  isPro,
  isSuspended,
}: UserActionsMenuProps) {
  const router = useRouter()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{
    top?: number
    bottom?: number
    left: number
  }>({ top: 0, left: 0 })

  const [busyKey, setBusyKey] = useState<UserCapabilityFlag | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [state, setState] = useState({
    admin: isAdmin,
    seller: isSeller,
    delivery: isDeliverer,
    verified: isVerified,
    pro: isPro,
    suspended: isSuspended,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setState({
      admin: isAdmin,
      seller: isSeller,
      delivery: isDeliverer,
      verified: isVerified,
      pro: isPro,
      suspended: isSuspended,
    })
  }, [isAdmin, isSeller, isDeliverer, isVerified, isPro, isSuspended])

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    function handleScrollOrResize() {
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [open])

  function handleToggleMenu() {
    if (open) {
      setOpen(false)
      return
    }
    setErrorMsg(null)
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      const menuWidth = 272
      const estimatedHeight = 400
      const left = Math.max(
        12,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12)
      )
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < estimatedHeight && rect.top > estimatedHeight) {
        setPosition({
          bottom: window.innerHeight - rect.top + 6,
          left,
        })
      } else {
        setPosition({
          top: rect.bottom + 6,
          left,
        })
      }
    }
    setOpen(true)
  }

  async function runToggle(
    capability: UserCapabilityFlag,
    nextValue: boolean
  ) {
    if (busyKey) return
    setBusyKey(capability)
    setErrorMsg(null)

    const prevState = { ...state }

    if (capability === 'buyer_only') {
      setState((s) => ({
        ...s,
        admin: false,
        seller: false,
        delivery: false,
      }))
    } else if (capability === 'verified') {
      setState((s) => ({
        ...s,
        verified: nextValue,
        seller: nextValue ? true : s.seller,
      }))
    } else {
      setState((s) => ({
        ...s,
        [capability]: nextValue,
      }))
    }

    const res = await adminToggleUserCapability(userId, capability, nextValue)
    setBusyKey(null)

    if (!res.ok) {
      setState(prevState)
      setErrorMsg(res.error || 'Update failed.')
      return
    }

    router.refresh()
  }

  const isSelf = currentAdminId === userId
  const isBuyerOnly = !state.admin && !state.seller && !state.delivery

  const ToggleRow = ({
    flag,
    label,
    checked,
    disabled,
    icon: Icon,
    accentClass,
  }: {
    flag: Exclude<UserCapabilityFlag, 'buyer_only'>
    label: string
    checked: boolean
    disabled?: boolean
    icon: any
    accentClass: string
  }) => {
    const isRowBusy = busyKey === flag
    return (
      <button
        type="button"
        disabled={disabled || busyKey !== null}
        onClick={() => runToggle(flag, !checked)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer'
        }`}
      >
        <span className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
          <Icon className={`w-4 h-4 shrink-0 ${accentClass}`} />
          <span>{label}</span>
        </span>

        {isRowBusy ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
        ) : (
          <span
            className={`w-8 h-4.5 rounded-full p-0.5 flex items-center transition-colors shrink-0 ${
              checked
                ? flag === 'suspended'
                  ? 'bg-red-600 justify-end'
                  : 'bg-blue-600 justify-end'
                : 'bg-slate-300 dark:bg-slate-700 justify-start'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-white shadow-2xs block" />
          </span>
        )}
      </button>
    )
  }

  const menuPortal = (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position.top,
        bottom: position.bottom,
        left: position.left,
      }}
      className="z-[9999] w-[272px] max-h-[82vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 space-y-1.5 text-left"
    >
      {/* Header */}
      <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-900 dark:text-white truncate">
            {displayName}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            {email || 'No email'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close actions menu"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {errorMsg && (
        <div className="mx-1 px-2.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-[11px] font-semibold text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Roles Section */}
      <div className="space-y-0.5">
        <span className="px-3 pt-1 text-[10px] font-black uppercase tracking-wider text-slate-400 block">
          Roles &amp; Access
        </span>

        <ToggleRow
          flag="admin"
          label={isSelf ? 'Admin (You)' : 'Admin Access'}
          checked={state.admin}
          disabled={isSelf && state.admin}
          icon={ShieldAlert}
          accentClass="text-red-500"
        />

        <ToggleRow
          flag="seller"
          label="Seller Access"
          checked={state.seller}
          icon={Store}
          accentClass="text-blue-600 dark:text-blue-400"
        />

        <ToggleRow
          flag="delivery"
          label="Deliverer Access"
          checked={state.delivery}
          icon={Truck}
          accentClass="text-sky-600 dark:text-sky-400"
        />

        <button
          type="button"
          disabled={isBuyerOnly || isSelf || busyKey !== null}
          onClick={() => runToggle('buyer_only', true)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
            isBuyerOnly || isSelf
              ? 'opacity-45 cursor-not-allowed'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer'
          }`}
        >
          <span className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
            <User className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Buyer Only</span>
          </span>
          {busyKey === 'buyer_only' ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
          ) : (
            <span className="text-[10px] font-bold text-slate-400">
              {isBuyerOnly ? 'Active' : 'Reset'}
            </span>
          )}
        </button>
      </div>

      {/* Store & Plan Section */}
      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
        <span className="px-3 pt-1 text-[10px] font-black uppercase tracking-wider text-slate-400 block">
          Store &amp; Subscription
        </span>

        <ToggleRow
          flag="verified"
          label="Verified Store"
          checked={state.verified}
          icon={ShieldCheck}
          accentClass="text-emerald-600 dark:text-emerald-400"
        />

        <ToggleRow
          flag="pro"
          label="Pro Seller Plan"
          checked={state.pro}
          icon={Crown}
          accentClass="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Account Safety Section */}
      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
        <ToggleRow
          flag="suspended"
          label="Suspend Account"
          checked={state.suspended}
          disabled={isSelf}
          icon={Ban}
          accentClass="text-red-600 dark:text-red-400"
        />
      </div>
    </div>
  )

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggleMenu}
        aria-label={`Manage ${displayName}`}
        className={`p-2 rounded-xl border transition cursor-pointer ${
          open
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && mounted ? createPortal(menuPortal, document.body) : null}
    </>
  )
}