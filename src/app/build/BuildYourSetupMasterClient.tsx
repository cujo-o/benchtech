'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/useCartStore'
import {
  generateAdaptiveSetupRecommendations,
  revalidateSetupItemsAction,
  type SetupConsultationInput,
  type SetupDeviceCategory,
  type SetupRecommendationOption,
} from './actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Smartphone,
  Camera,
  Gamepad2,
  Headphones,
  Laptop,
  Layers,
  Monitor,
  Cpu,
  GraduationCap,
  Video,
  Code2,
  Briefcase,
  Compass,
  Box,
  Sparkles,
  Radio,
  Music,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  ShoppingBag,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react'

const SETUP_TYPES: Array<{
  id: SetupDeviceCategory
  label: string
  desc: string
  icon: any
}> = [
  {
    id: 'phone_mobile',
    label: 'Smartphone & Mobile Tech',
    desc: 'iPhones, Samsung Galaxy, tablets, mobile photography, and everyday mobile gear.',
    icon: Smartphone,
  },
  {
    id: 'camera_creator',
    label: 'Camera, Vlogging & Content Gear',
    desc: 'DJI Osmo Pocket, action cameras, mirrorless/film cameras, microphones, and creator kits.',
    icon: Camera,
  },
  {
    id: 'gaming_console',
    label: 'Gaming Console & Entertainment',
    desc: 'PlayStation, Xbox, handheld consoles, gaming monitors, and extra controllers.',
    icon: Gamepad2,
  },
  {
    id: 'peripherals_accessories',
    label: 'Peripherals, Displays & Accessories',
    desc: 'Monitors, headphones, keyboards, mice, external storage, Starlink, and power backup.',
    icon: Headphones,
  },
  {
    id: 'laptop',
    label: 'Laptop',
    desc: 'A portable laptop matched to your battery life, screen size, and software needs.',
    icon: Laptop,
  },
  {
    id: 'laptop_workstation',
    label: 'Laptop Workstation',
    desc: 'A laptop paired with external monitor(s), dock, keyboard, mouse, and power protection.',
    icon: Layers,
  },
  {
    id: 'desktop',
    label: 'Desktop PC & Monitor Setup',
    desc: 'A desktop computer paired with a compatible display and desk peripherals.',
    icon: Monitor,
  },
  {
    id: 'multi_device',
    label: 'Complete Multi-Device Ecosystem',
    desc: 'Combine a phone, laptop, camera, monitor, or peripheral bundle within your budget.',
    icon: Cpu,
  },
]

const PURPOSE_CATEGORIES = [
  {
    id: 'content_creation',
    label: 'Content Creation, Vlogging & Photography',
    desc: 'TikTok/Reels, YouTube, DJI Osmo Pocket, photography, Premiere Pro, and design.',
    icon: Video,
  },
  {
    id: 'gaming',
    label: 'Gaming & Esports',
    desc: 'EA FC, Call of Duty, GTA, console gaming, or high-FPS PC gaming.',
    icon: Gamepad2,
  },
  {
    id: 'student',
    label: 'Student & Campus Life',
    desc: 'Coursework, research, lectures, battery longevity, and portable devices.',
    icon: GraduationCap,
  },
  {
    id: 'programming',
    label: 'Programming & Software Dev',
    desc: 'Web, mobile, backend, containers, IDEs, and multi-monitor coding.',
    icon: Code2,
  },
  {
    id: 'office_business',
    label: 'Business, Communication & Office',
    desc: 'WhatsApp business, calls, spreadsheets, multitasking, and productivity.',
    icon: Briefcase,
  },
  {
    id: 'engineering_cad',
    label: 'Engineering & Architecture',
    desc: 'AutoCAD, Revit, SolidWorks, and technical modelling.',
    icon: Compass,
  },
  {
    id: '3d_animation',
    label: '3D & Motion Graphics',
    desc: 'Blender, Cinema 4D, After Effects, and rendering.',
    icon: Box,
  },
  {
    id: 'ai_ml',
    label: 'AI & Data Science',
    desc: 'Model inference, Python data workflows, and GPU compute.',
    icon: Sparkles,
  },
  {
    id: 'cybersecurity',
    label: 'Cybersecurity & Virtual Labs',
    desc: 'Virtual machines, Docker containers, and network labs.',
    icon: ShieldAlert,
  },
  {
    id: 'streaming',
    label: 'Live Streaming & Broadcast',
    desc: 'OBS Studio, multi-camera streams, podcasts, and capture gear.',
    icon: Radio,
  },
  {
    id: 'music_production',
    label: 'Music & Audio Production',
    desc: 'Audio recording, mixing, studio headphones, and DAWs.',
    icon: Music,
  },
  {
    id: 'general',
    label: 'Everyday / Custom Use',
    desc: 'Daily communication, media, browsing, or custom hardware setup.',
    icon: SlidersHorizontal,
  },
]

const EXISTING_GEAR_OPTIONS = [
  { id: 'smartphone', label: 'Smartphone' },
  { id: 'laptop_pc', label: 'Laptop / PC' },
  { id: 'monitor', label: 'External Monitor / TV' },
  { id: 'camera_mic', label: 'Camera / Microphone' },
  { id: 'keyboard_mouse', label: 'Keyboard & Mouse' },
  { id: 'headset_audio', label: 'Headphones / Speakers' },
]

export function BuildYourSetupMasterClient() {
  const { addItem } = useCartStore()

  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5>(1)

  const [consultationMode, setConsultationMode] = useState<
    'quick' | 'detailed' | 'professional'
  >('quick')
  const [setupType, setSetupType] =
    useState<SetupDeviceCategory>('phone_mobile')
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([
    'content_creation',
  ])
  const [primaryPurpose, setPrimaryPurpose] =
    useState<string>('content_creation')

  const [budgetMax, setBudgetMax] = useState<string>('350000')
  const [budgetFlexibility, setBudgetFlexibility] = useState<
    'fixed' | 'somewhat_flexible' | 'flexible_if_worth_it'
  >('somewhat_flexible')
  const [valuePriority, setValuePriority] = useState<
    'balanced' | 'performance' | 'lowest_cost'
  >('balanced')
  const [conditionPreference, setConditionPreference] = useState<
    'any' | 'brand_new_only'
  >('any')
  const [existingEquipment, setExistingEquipment] = useState<string[]>([])
  const [powerBackupNeeded, setPowerBackupNeeded] = useState<boolean>(false)

  const [answers, setAnswers] = useState<Record<string, any>>({
    mobileOs: 'any',
    mobileStorage: '128_256',
    cameraStyle: 'any',
    peripheralFocus: 'any',
    gamingType: 'unsure',
    targetResolution: '1080p',
    studentCourse: 'computer_science',
    runsVirtualMachines: 'no',
    timelineComplexity: 'moderate',
    screenSize: '15_16',
    batteryTarget: '6_8',
    includeCompanion: 'no',
    preferredBrand: 'any',
    customNotes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [budgetNotice, setBudgetNotice] = useState<string | undefined>()
  const [options, setOptions] = useState<SetupRecommendationOption[]>([])
  const [addedLaneId, setAddedLaneId] = useState<string | null>(null)
  const [revalidatingLane, setRevalidatingLane] = useState<string | null>(null)

  function togglePurpose(id: string) {
    setSelectedPurposes((prev) => {
      const exists = prev.includes(id)
      const next = exists ? prev.filter((p) => p !== id) : [...prev, id]
      if (next.length === 0) return [id]
      if (!next.includes(primaryPurpose)) {
        setPrimaryPurpose(next[0])
      }
      return next
    })
  }

  function toggleExistingGear(id: string) {
    setExistingEquipment((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function updateAnswer(key: string, value: any) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  async function handleGenerateRecommendations() {
    setLoading(true)
    setError(null)

    const payload: SetupConsultationInput = {
      consultationMode,
      setupType,
      primaryPurpose,
      secondaryPurposes: selectedPurposes.filter((p) => p !== primaryPurpose),
      budgetMax: Number(budgetMax) || 0,
      budgetFlexibility,
      valuePriority,
      conditionPreference,
      existingEquipment,
      powerBackupNeeded,
      answers,
    }

    const res = await generateAdaptiveSetupRecommendations(payload)
    setLoading(false)

    if (!res.ok) {
      setError(res.error || 'Could not generate recommendations.')
      return
    }

    setBudgetNotice(res.budgetNotice)
    setOptions(res.options)
    setStage(5)
  }

  async function handleSwapItem(
    laneId: string,
    roleIndex: number,
    newProduct: any
  ) {
    setOptions((prev) =>
      prev.map((opt) => {
        if (opt.laneId !== laneId) return opt
        const updatedItems = opt.items.map((item, idx) => {
          if (idx !== roleIndex) return item
          const oldProduct = item.product
          const nextAlts = [
            oldProduct,
            ...item.alternatives.filter((a) => a.id !== newProduct.id),
          ]
          return {
            ...item,
            product: newProduct,
            alternatives: nextAlts,
          }
        })
        const nextTotal = updatedItems.reduce(
          (sum, i) => sum + Number(i.product.price || 0),
          0
        )
        return {
          ...opt,
          totalPrice: nextTotal,
          withinBudget:
            Number(budgetMax) > 0 ? nextTotal <= Number(budgetMax) * 1.15 : true,
          budgetDelta: Number(budgetMax) > 0 ? nextTotal - Number(budgetMax) : 0,
          items: updatedItems,
        }
      })
    )
  }

  async function handleAddSetupToCart(opt: SetupRecommendationOption) {
    setRevalidatingLane(opt.laneId)
    const ids = opt.items.map((i) => i.product.id)
    const check = await revalidateSetupItemsAction(ids)
    setRevalidatingLane(null)

    if (!check.ok) {
      setError(
        check.warnings.join(' ') ||
          'Selected items are no longer available in stock.'
      )
      return
    }

    for (const liveProd of check.validItems) {
      addItem({
        id: liveProd.id,
        title: liveProd.title,
        price: Number(liveProd.price || 0),
        image: Array.isArray(liveProd.images) ? liveProd.images[0] : '',
        seller_id: liveProd.seller_id,
        condition: liveProd.condition,
        brand: liveProd.brand,
        specs: liveProd.specs || {},
      })
    }

    setAddedLaneId(opt.laneId)
    setTimeout(() => setAddedLaneId(null), 2500)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge className="bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
            Adaptive Tech &amp; Setup Consultant
          </Badge>
          <span className="text-xs text-slate-400 font-semibold">
            Stage {stage} of 5
          </span>
        </div>

        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Build My Setup
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Whether you need a smartphone, a pocket vlogging camera, a gaming console, a monitor/peripheral upgrade, or a full workstation—tell us what you want to do and we will match verified Abuja inventory to your budget.
          </p>
        </div>

        <div className="grid grid-cols-5 gap-2 pt-2">
          {[
            { num: 1, label: '1. Device / Setup' },
            { num: 2, label: '2. Purpose' },
            { num: 3, label: '3. Preferences' },
            { num: 4, label: '4. Budget & Gear' },
            { num: 5, label: '5. Matches' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num < stage) setStage(s.num as any)
              }}
              className={`text-left p-2 rounded-xl border transition text-[11px] font-bold ${
                stage === s.num
                  ? 'border-blue-500 bg-blue-600/20 text-white'
                  : stage > s.num
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 cursor-pointer'
                  : 'border-slate-800 bg-slate-900/50 text-slate-500 cursor-default'
              }`}
            >
              <span className="truncate block">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* =====================================================================
          STAGE 1: ALL DEVICE & SETUP CATEGORIES (PHONES, CAMERAS, CONSOLES, LAPTOPS, PERIPHERALS)
          ===================================================================== */}
      {stage === 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              1. What kind of device or setup are you looking for?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select phones, cameras/vlogging gear (such as DJI Osmo Pocket), gaming consoles, peripherals, laptops, or a multi-device bundle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {SETUP_TYPES.map((st) => {
              const Icon = st.icon
              const active = setupType === st.id
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSetupType(st.id)}
                  className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
                    active
                      ? 'border-2 border-blue-600 bg-blue-50/40 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-black text-slate-900 dark:text-white block">
                      {st.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed block">
                      {st.desc}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Consultation Depth
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                {
                  id: 'quick',
                  label: 'Quick Match',
                  desc: 'Fast essentials: device type, main use, and budget.',
                },
                {
                  id: 'detailed',
                  label: 'Detailed Consultation',
                  desc: 'Includes storage, battery, companion accessories, and brand preferences.',
                },
                {
                  id: 'professional',
                  label: 'Specialist / Pro Workflow',
                  desc: 'Deep checks for creator codecs, studio gear, CAD, or multi-device setups.',
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setConsultationMode(m.id as any)}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    consultationMode === m.id
                      ? 'border-2 border-blue-600 bg-blue-50/40 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {m.label}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                    {m.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => setStage(2)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-6 gap-1.5 cursor-pointer"
            >
              <span>Continue to Purpose</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* =====================================================================
          STAGE 2: PURPOSE SELECTION
          ===================================================================== */}
      {stage === 2 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              2. What will you mainly use it for? (Select one or more)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose your primary and secondary activities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {PURPOSE_CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedPurposes.includes(cat.id)
              const isPrimary = primaryPurpose === cat.id

              return (
                <div
                  key={cat.id}
                  onClick={() => togglePurpose(cat.id)}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-2 border-blue-600 bg-blue-50/40 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <Badge
                          onClick={(e) => {
                            e.stopPropagation()
                            setPrimaryPurpose(cat.id)
                          }}
                          className={`text-[10px] font-bold cursor-pointer ${
                            isPrimary
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isPrimary ? 'Primary Use' : 'Set as Primary'}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {cat.label}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStage(1)}
              className="text-xs font-bold rounded-xl h-10 px-4 gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Button>
            <Button
              type="button"
              onClick={() => setStage(3)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-6 gap-1.5 cursor-pointer"
            >
              <span>Continue to Device Preferences</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* =====================================================================
          STAGE 3: ADAPTIVE QUESTIONS TAILORED TO PHONES, CAMERAS, CONSOLES, PERIPHERALS OR COMPUTERS
          ===================================================================== */}
      {stage === 3 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 text-xs">
          <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              3. Device &amp; Companion Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Questions are adapted to your selection ({setupType.replace(/_/g, ' ')}). Choose &quot;Not sure — recommend for me&quot; anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Branch A: Smartphone & Mobile */}
            {setupType === 'phone_mobile' && (
              <>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Preferred Mobile Ecosystem
                  </label>
                  <select
                    value={answers.mobileOs}
                    onChange={(e) => updateAnswer('mobileOs', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="any">No preference — best value in budget</option>
                    <option value="ios">Apple iOS (iPhone / iPad)</option>
                    <option value="android">Android (Samsung Galaxy, Pixel, etc.)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Target Storage &amp; Camera Priority
                  </label>
                  <select
                    value={answers.mobileStorage}
                    onChange={(e) =>
                      updateAnswer('mobileStorage', e.target.value)
                    }
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="128_256">128GB – 256GB (Balanced daily &amp; video)</option>
                    <option value="512_plus">512GB+ (Heavy 4K video &amp; creator storage)</option>
                    <option value="unsure">Not sure — recommend for me</option>
                  </select>
                </div>
              </>
            )}

            {/* Branch B: Camera, Vlogging & Creator Gear (DJI Osmo Pocket, Mirrorless, Film, Audio) */}
            {setupType === 'camera_creator' && (
              <>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Camera / Creator Form Factor
                  </label>
                  <select
                    value={answers.cameraStyle}
                    onChange={(e) =>
                      updateAnswer('cameraStyle', e.target.value)
                    }
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="any">
                      Any Camera or Creator Gear (Pocket Gimbal, Mirrorless, DSLR, Vintage)
                    </option>
                    <option value="pocket_vlog">
                      Pocket Gimbal / Action / Vlogging Camera (e.g. DJI Osmo Pocket, GoPro)
                    </option>
                    <option value="mirrorless_dslr">
                      Dedicated Mirrorless / DSLR / Photography Camera
                    </option>
                    <option value="audio_lighting">
                      Microphones, Audio Interfaces &amp; Studio Lighting
                    </option>
                  </select>
                </div>
              </>
            )}

            {/* Branch C: Gaming Console */}
            {setupType === 'gaming_console' && (
              <>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Console &amp; Display Preference
                  </label>
                  <select
                    value={answers.gamingType}
                    onChange={(e) => updateAnswer('gamingType', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="unsure">
                      Best available console (PlayStation / Xbox)
                    </option>
                    <option value="console_plus_monitor">
                      Console + External Monitor / Display Bundle
                    </option>
                  </select>
                </div>
              </>
            )}

            {/* Branch D: Peripherals, Displays & Accessories */}
            {setupType === 'peripherals_accessories' && (
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Primary Peripheral or Accessory Needed
                </label>
                <select
                  value={answers.peripheralFocus}
                  onChange={(e) =>
                    updateAnswer('peripheralFocus', e.target.value)
                  }
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  <option value="any">All Monitors, Audio &amp; Accessories</option>
                  <option value="monitor">External Monitor / Display</option>
                  <option value="audio">Headphones, Earbuds &amp; Microphones</option>
                  <option value="keyboard_mouse">Keyboards, Mice &amp; Docks</option>
                  <option value="networking">Starlink &amp; Networking Gear</option>
                </select>
              </div>
            )}

            {/* Branch E: Laptops & Workstations */}
            {(setupType === 'laptop' ||
              setupType === 'laptop_workstation' ||
              setupType === 'desktop') && (
              <>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Preferred Screen Size
                  </label>
                  <select
                    value={answers.screenSize}
                    onChange={(e) => updateAnswer('screenSize', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="13_14">13&quot; – 14&quot; (Compact &amp; Portable)</option>
                    <option value="15_16">15&quot; – 16&quot; (Balanced Workspace)</option>
                    <option value="24_plus">24&quot;+ External Monitor / Desktop</option>
                    <option value="unsure">No preference — recommend for me</option>
                  </select>
                </div>
              </>
            )}

            {/* Companion Device Option */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Include Companion Gear or Second Device in Bundle?
              </label>
              <select
                value={answers.includeCompanion}
                onChange={(e) =>
                  updateAnswer('includeCompanion', e.target.value)
                }
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              >
                <option value="no">
                  Single device focus (plus optional bundle comparison)
                </option>
                <option value="yes">
                  Yes — pair with a compatible monitor, camera, or accessory
                </option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              Specific Device Model, Keyword, or Requirement (Optional)
            </label>
            <input
              type="text"
              value={answers.customNotes}
              onChange={(e) => updateAnswer('customNotes', e.target.value)}
              placeholder="e.g. DJI Osmo Pocket, iPhone 13, PS4 Pro, Hisense Monitor, Dell Vostro..."
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStage(2)}
              className="text-xs font-bold rounded-xl h-10 px-4 gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Button>
            <Button
              type="button"
              onClick={() => setStage(4)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-6 gap-1.5 cursor-pointer"
            >
              <span>Continue to Budget &amp; Existing Gear</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* =====================================================================
          STAGE 4: BUDGET & EXISTING EQUIPMENT
          ===================================================================== */}
      {stage === 4 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 text-xs">
          <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              4. Budget &amp; Existing Equipment
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your target budget and select any gear you already own so we avoid recommending duplicates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Maximum Total Budget (₦)
              </label>
              <input
                type="number"
                min={10000}
                step={5000}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="e.g. 350000"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Budget Flexibility
              </label>
              <select
                value={budgetFlexibility}
                onChange={(e) => setBudgetFlexibility(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
              >
                <option value="fixed">Strict Maximum — Do not exceed</option>
                <option value="somewhat_flexible">
                  Somewhat Flexible (Up to +10% if worthwhile)
                </option>
                <option value="flexible_if_worth_it">
                  Flexible (+20% for a better tier or bundle)
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Recommendation Priority
              </label>
              <select
                value={valuePriority}
                onChange={(e) => setValuePriority(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              >
                <option value="balanced">Best Value &amp; Balance</option>
                <option value="performance">Maximum Capability</option>
                <option value="lowest_cost">Lowest Sensible Cost</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Device Condition Preference
              </label>
              <select
                value={conditionPreference}
                onChange={(e) => setConditionPreference(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              >
                <option value="any">
                  Brand New or Verified Foreign/Open-Box Used
                </option>
                <option value="brand_new_only">Brand New (Sealed) Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              Which equipment do you already own?
            </label>
            <div className="flex flex-wrap gap-2">
              {EXISTING_GEAR_OPTIONS.map((gear) => {
                const checked = existingEquipment.includes(gear.id)
                return (
                  <button
                    key={gear.id}
                    type="button"
                    onClick={() => toggleExistingGear(gear.id)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      checked
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {gear.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStage(3)}
              className="text-xs font-bold rounded-xl h-10 px-4 gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Button>

            <Button
              type="button"
              disabled={loading}
              onClick={handleGenerateRecommendations}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl h-11 px-7 gap-2 cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Matching Abuja Inventory...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Verified Recommendations</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* =====================================================================
          STAGE 5: VERIFIED RECOMMENDATION LANES
          ===================================================================== */}
      {stage === 5 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStage(1)}
                className="rounded-xl font-bold h-9 gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Device Type</span>
              </Button>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Target Budget: ₦{Number(budgetMax || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                step={25000}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="h-9 w-36 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black"
              />
              <Button
                type="button"
                size="sm"
                disabled={loading}
                onClick={handleGenerateRecommendations}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-9 px-3.5 gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recalculate</span>
              </Button>
            </div>
          </div>

          {budgetNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 font-semibold flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>{budgetNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
            {options.map((opt) => (
              <div
                key={opt.laneId}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between space-y-5 shadow-xs ${
                  opt.laneId === 'balanced'
                    ? 'border-2 border-blue-600'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      className={`text-[10px] font-black uppercase ${
                        opt.laneId === 'balanced'
                          ? 'bg-blue-600 text-white'
                          : opt.laneId === 'performance'
                          ? 'bg-purple-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {opt.laneLabel}
                    </Badge>

                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold text-emerald-600 border-emerald-300 dark:border-emerald-800"
                    >
                      {opt.compatibilityStatus}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                      {opt.headline}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        ₦{opt.totalPrice.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {opt.withinBudget ? 'Within Target' : 'Above Target'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {opt.whyItFits}
                  </p>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Included Catalog Items
                    </span>

                    {opt.items.map((entry, idx) => (
                      <div
                        key={entry.product.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">
                              {entry.roleLabel}
                            </span>
                            <Link
                              href={`/products/${entry.product.id}`}
                              target="_blank"
                              className="font-bold text-slate-900 dark:text-white hover:underline line-clamp-1"
                            >
                              {entry.product.title}
                            </Link>
                            <span className="text-[11px] text-slate-400 capitalize block">
                              {entry.product.condition.replace(/_/g, ' ')} •{' '}
                              {entry.product.seller_name}
                            </span>
                          </div>
                          <span className="font-black text-slate-900 dark:text-white shrink-0">
                            ₦{entry.product.price.toLocaleString()}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {entry.reason}
                        </p>

                        {entry.alternatives.length > 0 && (
                          <div className="pt-1">
                            <select
                              value=""
                              onChange={(e) => {
                                const chosen = entry.alternatives.find(
                                  (a) => a.id === e.target.value
                                )
                                if (chosen) {
                                  handleSwapItem(opt.laneId, idx, chosen)
                                }
                              }}
                              className="w-full h-8 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[11px] font-semibold"
                            >
                              <option value="">
                                Swap with alternative ({entry.alternatives.length} available)...
                              </option>
                              {entry.alternatives.map((alt) => (
                                <option key={alt.id} value={alt.id}>
                                  {alt.title} — ₦{alt.price.toLocaleString()}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    {opt.expectedCapabilities.map((cap, i) => (
                      <p
                        key={i}
                        className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </p>
                    ))}
                    {opt.knownLimitations.map((lim, i) => (
                      <p
                        key={i}
                        className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{lim}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    disabled={revalidatingLane === opt.laneId}
                    onClick={() => handleAddSetupToCart(opt)}
                    className={`w-full h-10 font-bold text-xs rounded-xl gap-1.5 cursor-pointer ${
                      addedLaneId === opt.laneId
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {revalidatingLane === opt.laneId ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Stock &amp; Price...</span>
                      </>
                    ) : addedLaneId === opt.laneId ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Added Setup to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add Validated Setup to Cart</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}