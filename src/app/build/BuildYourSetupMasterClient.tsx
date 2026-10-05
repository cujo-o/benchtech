'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/useCartStore'
import { generateCompleteSetup, askBuildAssistant } from './actions'
import {
  SetupCategoryKey,
  SetupCategory,
  ProductItem,
  GeneratedBuild,
  BuildComponent,
  ChatMessage,
} from './types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Gamepad2,
  Laptop,
  Video,
  GraduationCap,
  Briefcase,
  Box,
  Code2,
  Cpu,
  Radio,
  Sliders,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  RefreshCw,
  Share2,
  ShoppingCart,
  ShieldCheck,
  Package,
  Store,
  MapPin,
  Bot,
  Send,
  Loader2,
  Flame,
  Zap,
  Monitor,
  Eye,
  SlidersHorizontal,
  X,
} from 'lucide-react'

const SETUP_CATEGORIES: SetupCategory[] = [
  { id: 'gaming', title: 'Gaming Setup', subtitle: 'Battle station', tagline: 'High FPS, low-latency audio & mechanicals', iconName: 'Gamepad2', defaultBudget: 850000, primaryFocus: 'GPU & Display' },
  { id: 'laptop', title: 'Build a Laptop Setup', subtitle: 'Mobile workstation', tagline: 'Find the right laptop, dock & desk gear', iconName: 'Laptop', defaultBudget: 650000, primaryFocus: 'Portability' },
  { id: 'creator', title: 'Content Creation Setup', subtitle: 'Studio suite', tagline: 'Cameras, microphones, lighting & high storage', iconName: 'Video', defaultBudget: 1400000, primaryFocus: 'Color & Video' },
  { id: 'student', title: 'Student Setup', subtitle: 'School & study', tagline: 'Affordable, reliable tech for university', iconName: 'GraduationCap', defaultBudget: 450000, primaryFocus: 'Battery & Value' },
  { id: 'work', title: 'Work / Business Setup', subtitle: 'Productivity desk', tagline: 'Multitasking, office apps & conference audio', iconName: 'Briefcase', defaultBudget: 700000, primaryFocus: 'Reliability' },
  { id: 'design_3d', title: 'Design & 3D Setup', subtitle: 'Modeling & CAD', tagline: 'Blender, 3D rendering, animation & CAD', iconName: 'Box', defaultBudget: 1500000, primaryFocus: 'Compute & RAM' },
  { id: 'video_editing', title: 'Video Editing Setup', subtitle: 'Timeline suite', tagline: '4K Premiere, DaVinci, fast NVMe playback', iconName: 'Video', defaultBudget: 1300000, primaryFocus: 'Fast Storage' },
  { id: 'programming', title: 'Programming Setup', subtitle: 'Dev environment', tagline: 'Dual monitors, Linux/macOS, compiling speed', iconName: 'Code2', defaultBudget: 950000, primaryFocus: 'CPU & RAM' },
  { id: 'ai_ml', title: 'AI / Machine Learning', subtitle: 'Data science rig', tagline: 'Local tensor operations, deep learning, PyTorch', iconName: 'Cpu', defaultBudget: 1800000, primaryFocus: 'VRAM & Tensor' },
  { id: 'streaming', title: 'Gaming + Streaming', subtitle: 'Broadcast setup', tagline: 'Game and stream simultaneously with zero lag', iconName: 'Radio', defaultBudget: 1200000, primaryFocus: 'Multitasking' },
  { id: 'custom', title: 'Custom / Other Setup', subtitle: 'Bespoke requirements', tagline: 'Tell us your exact workflow in your own words', iconName: 'Sliders', defaultBudget: 800000, primaryFocus: 'Custom' },
]

const POPULAR_SETUPS = [
  { category: 'student', title: 'Student Essentials', price: 450000, budget: 450000, badge: 'Popular in Minna & Abuja' },
  { category: 'programming', title: 'Programming Pro Rig', price: 1200000, budget: 1200000, badge: 'High RAM' },
  { category: 'creator', title: 'Content Creator Pro', price: 2400000, budget: 2400000, badge: '4K Studio' },
  { category: 'gaming', title: 'Casual 1440p Gaming', price: 850000, budget: 850000, badge: 'Best Value' },
]

const BUDGET_PRESETS = [500000, 750000, 1000000, 1500000, 2000000]

const GAME_SUGGESTIONS = ['GTA V / GTA 6', 'Fortnite', 'Call of Duty', 'Cyberpunk 2077', 'Minecraft', 'Apex Legends', 'Valorant', 'FIFA / EA FC']
const DEV_SUGGESTIONS = ['VS Code', 'Docker', 'Next.js / Node', 'PyTorch / AI', 'PostgreSQL', 'Android Studio']
const CREATOR_SUGGESTIONS = ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Blender 3D', 'Photoshop', 'OBS Studio']

function resolveFirstImage(images: any): string | null {
  if (!images) return null
  if (Array.isArray(images)) return images[0] || null
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) return parsed[0] || null
    } catch {
      return images.startsWith('http') ? images : null
    }
  }
  return null
}

export function BuildYourSetupMasterClient({
  initialProducts,
}: {
  initialProducts: ProductItem[]
}) {
  const { addItem } = useCartStore()

  // Workflow Stage: 'hub' (Screens 1 & 2) | 'survey' (Screens 3 & 4) | 'loading' (Screen 5) | 'results' (Screens 6 to 12)
  const [currentStage, setCurrentStage] = useState<'hub' | 'survey' | 'loading' | 'results'>('hub')

  // Survey Wizard Step (1: Category, 2: Budget, 3: Apps & Priorities)
  const [surveyStep, setSurveyStep] = useState<number>(1)

  // Survey State
  const [selectedCategory, setSelectedCategory] = useState<SetupCategoryKey>('gaming')
  const [budget, setBudget] = useState<number>(850000)
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [performancePriority, setPerformancePriority] = useState<'maximum' | 'balanced' | 'value'>('balanced')
  const [powerPriority, setPowerPriority] = useState<string>('High (Include UPS / Inverter Power)')
  const [formFactor, setFormFactor] = useState<string>('Laptop-first Workstation')
  const [customText, setCustomText] = useState<string>('')

  // Build Results State
  const [activeBuild, setActiveBuild] = useState<GeneratedBuild | null>(null)
  const [alternatives, setAlternatives] = useState<{
    maxPerformance: GeneratedBuild | null
    budgetFriendly: GeneratedBuild | null
  }>({ maxPerformance: null, budgetFriendly: null })

  // Active View Tab on Results Screen: 'overview' | 'components' | 'performance' | 'compare'
  const [resultTab, setResultTab] = useState<'overview' | 'components' | 'performance' | 'compare'>('overview')

  // Component Swap Drawer
  const [swappingComponent, setSwappingComponent] = useState<BuildComponent | null>(null)

  // AI Chat Assistant State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState<string>('')
  const [chatLoading, setChatLoading] = useState<boolean>(false)

  // Feedback states
  const [cartAdded, setCartAdded] = useState<boolean>(false)
  const [copiedLink, setCopiedLink] = useState<boolean>(false)

  // Handler: Start Questionnaire from Category Card
  const handleStartCategory = (categoryKey: SetupCategoryKey, customBudget?: number) => {
    setSelectedCategory(categoryKey)
    const catConfig = SETUP_CATEGORIES.find((c) => c.id === categoryKey)
    setBudget(customBudget || catConfig?.defaultBudget || 750000)
    setSurveyStep(2) // Move to budget
    setCurrentStage('survey')
  }

  // Handler: Submit Survey & Generate Build
  const handleExecuteBuild = async () => {
    setCurrentStage('loading')

    const res = await generateCompleteSetup({
      category: selectedCategory,
      budget,
      selectedApps,
      performancePriority,
      formFactor,
      powerPriority,
      useCaseDescription: customText,
      specificPreferences: customText,
    })

    if (res.success && res.recommendedBuild) {
      setActiveBuild(res.recommendedBuild)
      setAlternatives({
        maxPerformance: res.alternatives.maxPerformance,
        budgetFriendly: res.alternatives.budgetFriendly,
      })

      // Seed initial AI welcome message
      setChatMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: `Welcome! I've engineered this ${res.recommendedBuild.title} within your ₦${budget.toLocaleString()} target with 100% compatibility across Abuja inventory. What would you like to know about it?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])

      setCurrentStage('results')
    } else {
      alert(res.error || 'Failed to generate setup. Please try again.')
      setCurrentStage('survey')
    }
  }

  // Handler: Swap a Component
  const handleApplyComponentSwap = (newProduct: ProductItem) => {
    if (!activeBuild || !swappingComponent) return

    const updatedComponents = activeBuild.components.map((comp) => {
      if (comp.slotKey === swappingComponent.slotKey) {
        return {
          ...comp,
          product: newProduct,
          reasonWhy: `Manually swapped to ${newProduct.title} from verified merchant stock.`,
        }
      }
      return comp
    })

    const newTotal = updatedComponents.reduce((sum, c) => sum + (Number(c.product?.price) || 0), 0)

    setActiveBuild({
      ...activeBuild,
      totalPrice: newTotal,
      components: updatedComponents,
    })

    setSwappingComponent(null)
  }

  // Handler: Send Message to AI Assistant
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput.trim()
    if (!textToSend || !activeBuild) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setChatMessages((prev) => [...prev, userMsg])
    if (!presetText) setChatInput('')
    setChatLoading(true)

    const res = await askBuildAssistant(activeBuild, textToSend)

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: res.answer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setChatMessages((prev) => [...prev, aiMsg])
    setChatLoading(false)
  }

  // Handler: Add Entire Setup to Cart
  const handleAddAllToCart = () => {
    if (!activeBuild) return
    activeBuild.components.forEach((comp) => {
      if (comp.product) {
        addItem({
          id: comp.product.id,
          title: comp.product.title,
          price: Number(comp.product.price),
          image: resolveFirstImage(comp.product.images) || '',
          seller_id: comp.product.seller_id,
          condition: comp.product.condition,
        })
      }
    })
    setCartAdded(true)
    setTimeout(() => setCartAdded(false), 2500)
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const toggleAppSelection = (app: string) => {
    setSelectedApps((prev) => (prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]))
  }

  // Render Category Icon Helper
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Gamepad2': return <Gamepad2 className="w-5 h-5" />
      case 'Laptop': return <Laptop className="w-5 h-5" />
      case 'Video': return <Video className="w-5 h-5" />
      case 'GraduationCap': return <GraduationCap className="w-5 h-5" />
      case 'Briefcase': return <Briefcase className="w-5 h-5" />
      case 'Box': return <Box className="w-5 h-5" />
      case 'Code2': return <Code2 className="w-5 h-5" />
      case 'Cpu': return <Cpu className="w-5 h-5" />
      case 'Radio': return <Radio className="w-5 h-5" />
      default: return <Sliders className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-8 min-h-screen">
      {/* =========================================================================
          STAGE 1 & 2: HUB & CATEGORY SELECTION (Screens 1 & 2)
         ========================================================================= */}
      {currentStage === 'hub' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Visual 8 Screen 1: Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 via-indigo-800 to-slate-950 text-white p-6 sm:p-10 shadow-lg">
            <div className="max-w-2xl space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                AI Setup Architect • Abuja Verified Stock
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Build Your Perfect Tech Setup
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Tell us what you need. Our AI configures matching machines, displays, input gear, and power resilience for your lifestyle, budget, and goals with TechTrust escrow safety.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  onClick={() => handleStartCategory('gaming')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-black text-xs px-6 h-11 rounded-xl gap-2 shadow-md cursor-pointer"
                >
                  Start Building Now <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Visual 8 Screen 2: Choose Your Purpose Grid (11 Categories) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Choose Your Setup Category
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your primary workflow to launch the adaptive AI assistant
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {SETUP_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleStartCategory(cat.id)}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/70 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {renderCategoryIcon(cat.iconName)}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      from ₦{(cat.defaultBudget / 1000).toFixed(0)}k
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {cat.tagline}
                    </p>
                  </div>

                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-1">
                    Build Setup <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Setups Showcase Row */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
              Popular Pre-Engineered Setups
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {POPULAR_SETUPS.map((pop, idx) => (
                <div
                  key={idx}
                  onClick={() => handleStartCategory(pop.category as SetupCategoryKey, pop.budget)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 transition"
                >
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-blue-600">{pop.badge}</span>
                    <h4 className="font-bold text-xs">{pop.title}</h4>
                    <p className="text-xs font-black">₦{pop.price.toLocaleString()}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold rounded-xl">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 2: ADAPTIVE QUESTIONNAIRE WIZARD (Screens 3 & 4)
         ========================================================================= */}
      {currentStage === 'survey' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
          {/* Header Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (surveyStep > 2) setSurveyStep(surveyStep - 1)
                else setCurrentStage('hub')
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-none text-[10px] font-black uppercase">
              Step {surveyStep - 1} of 3
            </Badge>
          </div>

          {/* Stepper Indicator */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-slate-400">
            <div className="text-blue-600 border-b-2 border-blue-600 pb-1">1. Purpose</div>
            <div className={surveyStep >= 2 ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'pb-1'}>2. Budget</div>
            <div className={surveyStep >= 3 ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'pb-1'}>3. Preferences</div>
            <div className="pb-1">4. Review</div>
          </div>

          {/* AI Guide Card */}
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <p className="text-xs text-purple-950 dark:text-purple-200">
              Great choice! I will analyze real listings across Banex and Emab plazas to engineer your custom setup.
            </p>
          </div>

          {/* Step 2: Budget Questionnaire (Screen 3) */}
          {surveyStep === 2 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="text-base font-black">What is your target budget?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  We use this as a strict constraint to allocate component costs accurately.
                </p>
              </div>

              {/* Direct Naira Input Box */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Exact Amount in Naira (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-400">₦</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="100000"
                    step="25000"
                    value={budget || ''}
                    onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                    placeholder="Enter custom budget..."
                    className="w-full pl-8 pr-4 py-2 text-sm font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preset Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Or select a standard tier
                </span>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBudget(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        budget === p
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      ₦{p.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Performance Priority */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Performance &amp; Value Profile
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'maximum', label: 'Max Performance', desc: 'Raw power prioritized' },
                    { id: 'balanced', label: 'Balanced (Rec)', desc: 'Best blend of cost & speed' },
                    { id: 'value', label: 'Best Value', desc: 'Avoids overspending' },
                  ].map((prof) => (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => setPerformancePriority(prof.id as any)}
                      className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer ${
                        performancePriority === prof.id
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold ring-1 ring-blue-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-bold">{prof.label}</div>
                      <div className="text-[10px] text-slate-400">{prof.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setSurveyStep(3)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 rounded-xl shadow-xs cursor-pointer"
              >
                Next: Specific Apps &amp; Workload →
              </Button>
            </div>
          )}

          {/* Step 3: Dynamic Category-Specific Questions (Screen 4) */}
          {surveyStep === 3 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="text-base font-black">Specify your target software &amp; hardware</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Helps the AI configure matching RAM, GPU clock speeds, and peripherals.
                </p>
              </div>

              {/* Dynamic Target Selection */}
              {selectedCategory === 'gaming' || selectedCategory === 'streaming' ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Which games do you plan to run? (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GAME_SUGGESTIONS.map((game) => (
                      <button
                        key={game}
                        type="button"
                        onClick={() => toggleAppSelection(game)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          selectedApps.includes(game)
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {game}
                      </button>
                    ))}
                  </div>
                </div>
              ) : selectedCategory === 'programming' || selectedCategory === 'ai_ml' ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Core Developer Tools
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DEV_SUGGESTIONS.map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => toggleAppSelection(app)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          selectedApps.includes(app)
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Creative &amp; Work Applications
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CREATOR_SUGGESTIONS.map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => toggleAppSelection(app)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          selectedApps.includes(app)
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Abuja Power & Form Factor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Form Factor Preference
                  </label>
                  <select
                    value={formFactor}
                    onChange={(e) => setFormFactor(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none"
                  >
                    <option value="Laptop-first Workstation">Laptop-first Workstation</option>
                    <option value="Custom Desktop Tower">Custom Desktop Tower</option>
                    <option value="Apple Mac Ecosystem">Apple Mac Ecosystem</option>
                    <option value="Compact Mini PC">Compact Mini PC</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Abuja Outage Priority (Power)
                  </label>
                  <select
                    value={powerPriority}
                    onChange={(e) => setPowerPriority(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none"
                  >
                    <option value="High (Include UPS / Inverter Power)">High (Reserve UPS/Backup)</option>
                    <option value="Standard (Focus on Laptop Battery)">Standard (Laptop Battery)</option>
                    <option value="Low (Already have Inverter)">Low (Home Inverter Present)</option>
                  </select>
                </div>
              </div>

              {/* Custom Free-form Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Specific Requirements or Notes (Optional)
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="e.g. Prefer 16GB RAM minimum, mechanical switches, minimal clean look..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                />
              </div>

              <Button
                onClick={handleExecuteBuild}
                className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm h-12 rounded-xl shadow-lg cursor-pointer gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Generate My Custom Setup →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          STAGE 3: ANIMATED AI GENERATION SCANNER (Screen 5)
         ========================================================================= */}
      {currentStage === 'loading' && (
        <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6 animate-in zoom-in-95">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-3xl bg-linear-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center shadow-xl">
              <Bot className="w-10 h-10 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black">Assembling Your Rig</h2>
            <p className="text-xs text-slate-400">
              Evaluating live marketplace stock across Banex, Emab, and Wuse 2...
            </p>
          </div>

          {/* Checklist with simulated real-time ticks */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 text-left space-y-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 text-emerald-600 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Analyzing performance requirements</span>
            </div>
            <div className="flex items-center gap-2.5 text-emerald-600 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Matching verified inventory in Abuja</span>
            </div>
            <div className="flex items-center gap-2.5 text-blue-600 font-bold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Checking 100% hardware compatibility</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400">
              <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
              <span>Optimizing pricing &amp; TechTrust escrow</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 4: COMPLETE RESULTS & WORKBENCH (Screens 6 to 12)
         ========================================================================= */}
      {currentStage === 'results' && activeBuild && (
        <div className="space-y-8 animate-in fade-in">
          {/* Visual 8 Screen 6: Top Header & Build Score Hero Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold">
                    <Check className="w-3 h-3 mr-0.5" /> 100% Compatible
                  </Badge>
                  <span className="text-xs text-slate-400">All components verified to work together</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                  {activeBuild.title}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeBuild.tagline}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="text-xs font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700 gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Share'}</span>
                </Button>
                <Button
                  onClick={handleAddAllToCart}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-2 shadow-xs cursor-pointer"
                >
                  {cartAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                  <span>{cartAdded ? 'Added to Cart!' : 'Add All to Cart'}</span>
                </Button>
              </div>
            </div>

            {/* Price & Score Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-8 flex flex-col sm:flex-row sm:items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  ₦{activeBuild.totalPrice.toLocaleString()}
                </span>
                {activeBuild.savings > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black">
                    Save ₦{activeBuild.savings.toLocaleString()} vs Retail
                  </Badge>
                )}
                <span className="text-xs text-slate-400">
                  Target: ₦{activeBuild.targetBudget.toLocaleString()}
                </span>
              </div>

              {/* Build Score Circular Indicator */}
              <div className="sm:col-span-4 flex items-center justify-start sm:justify-end gap-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 flex flex-col items-center justify-center shrink-0">
                  <span className="text-base font-black text-purple-700 dark:text-purple-300 leading-none">
                    {activeBuild.score}
                  </span>
                  <span className="text-[9px] font-bold text-purple-500 uppercase">/100</span>
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Setup Score</span>
                  <span className="text-[11px] text-slate-400">Based on value, thermal headroom &amp; speed</span>
                </div>
              </div>
            </div>

            {/* Highlight Badges */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {activeBuild.badges.map((b, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  ✓ {b}
                </span>
              ))}
            </div>

            {/* Rationale Callout */}
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic border-l-2 border-blue-500 pl-3">
              "{activeBuild.rationale}"
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            {[
              { id: 'overview', label: 'Component Breakdown' },
              { id: 'performance', label: 'Performance & Benchmarks' },
              { id: 'compare', label: 'Compare 3 Tier Options' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setResultTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  resultTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* =========================================================================
              SCREEN 7: COMPONENT BREAKDOWN TABLE
             ========================================================================= */}
          {resultTab === 'overview' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-sm">Components ({activeBuild.components.length} Items)</h3>
                <span className="text-xs text-emerald-600 font-bold">✓ 100% Verified Abuja Stock</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Slot</th>
                      <th className="pb-3">Product Item</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3">Why this part?</th>
                      <th className="pb-3 text-right">Customize</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeBuild.components.map((c) => {
                      const firstImg = resolveFirstImage(c.product?.images)
                      return (
                        <tr key={c.slotKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-4 font-bold text-slate-400 text-[11px] whitespace-nowrap">
                            {c.slotName}
                          </td>
                          <td className="py-4 font-bold">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                {firstImg ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={firstImg} alt={c.product.title} className="w-full h-full object-contain p-1" />
                                ) : (
                                  <Package className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="block truncate max-w-xs text-slate-900 dark:text-slate-100">
                                  {c.product?.title}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-normal">
                                  <Store className="w-3 h-3" />
                                  {c.product?.profiles?.business_name || 'Verified Vendor'} • {c.product?.profiles?.district || 'Abuja'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            ₦{Number(c.product?.price || 0).toLocaleString()}
                          </td>
                          <td className="py-4 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs leading-relaxed">
                            {c.reasonWhy}
                          </td>
                          <td className="py-4 text-right whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSwappingComponent(c)}
                              className="text-[11px] font-bold rounded-xl h-8 px-3 border-slate-200 dark:border-slate-700 gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" /> Swap
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              SCREEN 9: PERFORMANCE & BENCHMARK VIEW
             ========================================================================= */}
          {resultTab === 'performance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ratings Overview */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
                <h3 className="font-black text-sm">Performance Overview</h3>
                <div className="space-y-3 text-xs">
                  {Object.entries(activeBuild.performanceRatings).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between font-bold capitalize">
                        <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-blue-600">{val}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real World Benchmark Targets */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
                <h3 className="font-black text-sm">Real World Performance Targets</h3>
                <div className="grid grid-cols-2 gap-3">
                  {activeBuild.benchmarks.map((bm, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] uppercase font-black text-blue-600 block">{bm.label}</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{bm.rating}</p>
                      <p className="text-[10px] text-slate-400">{bm.target}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SCREEN 10: SAVE & COMPARE 3 TIER OPTIONS
             ========================================================================= */}
          {resultTab === 'compare' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Max Performance */}
              {alternatives.maxPerformance && (
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-black text-purple-600">Option 1 • Max Speed</span>
                    <h4 className="font-black text-sm">Maximum Performance</h4>
                    <p className="text-xl font-black">₦{alternatives.maxPerformance.totalPrice.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400">Score: {alternatives.maxPerformance.score}/100 • Higher spec components</p>
                  </div>
                  <Button
                    onClick={() => setActiveBuild(alternatives.maxPerformance)}
                    variant="outline"
                    className="w-full text-xs font-bold rounded-xl h-9"
                  >
                    Select This Build
                  </Button>
                </div>
              )}

              {/* Option 2: Recommended Best Value */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-md space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <Badge className="bg-blue-600 text-white text-[9px]">Option 2 • Recommended</Badge>
                  <h4 className="font-black text-sm">{activeBuild.title}</h4>
                  <p className="text-2xl font-black text-blue-600">₦{activeBuild.totalPrice.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400">Score: {activeBuild.score}/100 • Optimal budget balance</p>
                </div>
                <Button className="w-full bg-blue-600 text-white text-xs font-bold rounded-xl h-9">
                  Active Build
                </Button>
              </div>

              {/* Option 3: Budget Friendly */}
              {alternatives.budgetFriendly && (
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-black text-emerald-600">Option 3 • Budget Saver</span>
                    <h4 className="font-black text-sm">Budget-Friendly Variant</h4>
                    <p className="text-xl font-black">₦{alternatives.budgetFriendly.totalPrice.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400">Score: {alternatives.budgetFriendly.score}/100 • Saves ₦{alternatives.budgetFriendly.savings.toLocaleString()}</p>
                  </div>
                  <Button
                    onClick={() => setActiveBuild(alternatives.budgetFriendly)}
                    variant="outline"
                    className="w-full text-xs font-bold rounded-xl h-9"
                  >
                    Select This Build
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              SCREEN 11 & 12: BUY SUMMARY & INTERACTIVE AI CHAT
             ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual 8 Screen 12: AI Chat Assistant (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Bot className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-black text-sm">Ask About Your Build</h3>
                  <p className="text-[10px] text-slate-400">Live AI guidance grounded in your active components</p>
                </div>
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Can this run GTA 6?',
                  'Why this processor?',
                  'Cheaper alternative?',
                  'Can I upgrade RAM later?',
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSendChatMessage(chip)}
                    disabled={chatLoading}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Transcript */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-xs [scrollbar-width:thin]">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white ml-auto max-w-[80%]'
                        : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mr-auto max-w-[90%]'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className="text-[9px] opacity-60 block mt-1">{msg.timestamp}</span>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI is consulting hardware specs...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder="Ask anything about compatibility, thermals, gaming..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                />
                <Button
                  onClick={() => handleSendChatMessage()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl px-3 h-9"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Visual 8 Screen 11: Checkout Summary Card (5 cols) */}
            <div className="lg:col-span-5 bg-linear-to-b from-slate-900 to-indigo-950 text-white border border-indigo-900 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                  Ready for Purchase
                </span>
                <h3 className="text-lg font-black tracking-tight">Your Rig is Ready!</h3>
                <p className="text-xs text-indigo-200">
                  {activeBuild.components.length} components • 100% verified compatibility
                </p>
              </div>

              <div className="space-y-2 text-xs border-t border-white/10 pt-3 text-indigo-100">
                <div className="flex justify-between">
                  <span>Hardware Subtotal:</span>
                  <span className="font-bold text-white">₦{activeBuild.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Abuja Inspection / Meetup:</span>
                  <span className="font-bold text-emerald-400">Free (TechTrust Protected)</span>
                </div>
                <div className="flex justify-between">
                  <span>7-Day Buyer Escrow Protection:</span>
                  <span className="font-bold text-emerald-400">Included</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10 text-base font-black text-white">
                  <span>Total Payable:</span>
                  <span className="text-emerald-400">₦{activeBuild.totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handleAddAllToCart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm h-12 rounded-xl shadow-lg cursor-pointer gap-2"
              >
                {cartAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                <span>{cartAdded ? 'Added All to Cart!' : 'Add All to Cart & Checkout'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 8: COMPONENT SWAP DRAWER / MODAL
         ========================================================================= */}
      {swappingComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs animate-in fade-in"
            onClick={() => setSwappingComponent(null)}
          />

          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4 max-h-[85vh] flex flex-col text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-base">Swap {swappingComponent.slotName}</h3>
                <p className="text-xs text-slate-400">
                  Select a compatible alternative currently available in Abuja plazas
                </p>
              </div>
              <button
                onClick={() => setSwappingComponent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 [scrollbar-width:thin]">
              {swappingComponent.alternatives && swappingComponent.alternatives.length > 0 ? (
                swappingComponent.alternatives.map((alt) => {
                  const firstImg = resolveFirstImage(alt.images)
                  const priceDiff = Number(alt.price) - Number(swappingComponent.product?.price || 0)

                  return (
                    <div
                      key={alt.id}
                      onClick={() => handleApplyComponentSwap(alt)}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50/40 dark:bg-slate-800/40 flex items-center justify-between gap-3 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                          {firstImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={firstImg} alt={alt.title} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs truncate">{alt.title}</h4>
                          <p className="text-xs font-black text-blue-600">₦{Number(alt.price).toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">
                            {alt.profiles?.business_name || 'Vendor'} • {alt.profiles?.district || 'Abuja'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[11px] font-black block ${priceDiff > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {priceDiff > 0 ? `+₦${priceDiff.toLocaleString()}` : `-₦${Math.abs(priceDiff).toLocaleString()}`}
                        </span>
                        <Button size="sm" className="bg-blue-600 text-white text-[10px] font-bold h-7 px-2.5 rounded-lg mt-1">
                          Select
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No other direct alternatives found for this slot.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}