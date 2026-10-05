"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store/useCartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIBuildAssistantModal } from "./AIBuildAssistantModal";
import {
  Laptop,
  Monitor,
  Headphones,
  Zap,
  Gamepad2,
  Code2,
  Video,
  GraduationCap,
  Sparkles,
  Plus,
  RefreshCw,
  Check,
  ShoppingCart,
  ShieldCheck,
  Share2,
  Trash2,
  Store,
  MapPin,
  ArrowRight,
  Package,
  X,
  Bot,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  category?: string;
  brand?: string;
  condition?: string;
  images?: any;
  seller_id: string;
  profiles?: {
    business_name?: string;
    district?: string;
    tech_trust_status?: string;
  };
}

interface SetupSlot {
  key: string;
  name: string;
  description: string;
  icon: any;
  categoryFilter: string[];
}

const SETUP_SLOTS: SetupSlot[] = [
  {
    key: "machine",
    name: "Primary Machine",
    description: "Laptop, Desktop workstation, or Console",
    icon: Laptop,
    categoryFilter: ["laptops", "phones", "gaming"],
  },
  {
    key: "display",
    name: "Display & Monitor",
    description: "External 4K, 144Hz, or ultra-wide screen",
    icon: Monitor,
    categoryFilter: ["monitors", "tablets", "accessories"],
  },
  {
    key: "peripherals",
    name: "Audio & Input",
    description: "Mechanical keyboard, mouse, or ANC headset",
    icon: Headphones,
    categoryFilter: ["accessories", "wearables", "gaming"],
  },
  {
    key: "power",
    name: "Power & Resilience",
    description: "UPS backup, power station, dock, or MiFi",
    icon: Zap,
    categoryFilter: ["networking", "smarthome", "accessories"],
  },
];

const PRESET_ARCHETYPES = [
  {
    id: "developer",
    label: "Developer & Engineering",
    icon: Code2,
    tagline: "High-RAM multitasking & dual display workflows",
    recommendedBudget: 950000,
    slotKeywords: {
      machine: ["m1", "m2", "m3", "i7", "ryzen 7", "thinkpad", "macbook", "dell"],
      display: ["monitor", "dell", "lg", "screen"],
      peripherals: ["keyboard", "mx", "mouse", "headset"],
      power: ["hub", "dock", "ups", "mifi"],
    },
  },
  {
    id: "creator",
    label: "Content & Video Studio",
    icon: Video,
    tagline: "4K color grading, audio fidelity & high storage",
    recommendedBudget: 1400000,
    slotKeywords: {
      machine: ["pro", "m2", "m3", "rtx", "legion", "macbook"],
      display: ["4k", "ips", "monitor", "ultrawide"],
      peripherals: ["sony", "mic", "headphone", "audio"],
      power: ["ssd", "nvme", "external", "hub"],
    },
  },
  {
    id: "gamer",
    label: "Gaming Battle Station",
    icon: Gamepad2,
    tagline: "High frame-rates, low-latency audio & mechanicals",
    recommendedBudget: 850000,
    slotKeywords: {
      machine: ["ps5", "xbox", "gaming", "rtx", "alienware", "nitro"],
      display: ["144hz", "165hz", "monitor", "gaming"],
      peripherals: ["headset", "controller", "mouse", "keyboard"],
      power: ["ups", "inverter", "stand", "hub"],
    },
  },
  {
    id: "student",
    label: "Student & Everyday",
    icon: GraduationCap,
    tagline: "Compact portability, reliable battery & study tools",
    recommendedBudget: 450000,
    slotKeywords: {
      machine: ["hp", "dell", "ipad", "air", "thinkpad"],
      display: ["tablet", "monitor", "portable"],
      peripherals: ["airpods", "buds", "mouse", "headset"],
      power: ["power bank", "mifi", "bag"],
    },
  },
  {
    id: "wfh_power",
    label: "Abuja Power & WFH",
    icon: Zap,
    tagline: "Outage-resilient setup with dedicated backup power",
    recommendedBudget: 750000,
    slotKeywords: {
      machine: ["laptop", "latitude", "thinkpad", "elitebook"],
      display: ["monitor", "screen"],
      peripherals: ["headset", "mouse"],
      power: ["ups", "power station", "inverter", "mifi"],
    },
  },
];

const BUDGET_PRESETS = [
  { label: "₦450k Entry", value: 450000 },
  { label: "₦850k Pro", value: 850000 },
  { label: "₦1.5M Studio", value: 1500000 },
  { label: "₦2.5M+ Ultimate", value: 2500000 },
];

function resolveFirstImage(images: any): string | null {
  if (!images) return null;
  if (Array.isArray(images)) return images[0] || null;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed[0] || null;
    } catch {
      return images.startsWith("http") ? images : null;
    }
  }
  return null;
}

export function BuildSetupClient({ initialProducts }: { initialProducts: Product[] }) {
  const { addItem } = useCartStore();

  const [activeArchetype, setActiveArchetype] = useState(PRESET_ARCHETYPES[0].id);
  const [targetBudget, setTargetBudget] = useState<number>(PRESET_ARCHETYPES[0].recommendedBudget);
  const [selectedItems, setSelectedItems] = useState<Record<string, Product | null>>({
    machine: null,
    display: null,
    peripherals: null,
    power: null,
  });

  const [aiRationale, setAiRationale] = useState<{ title: string; text: string } | null>(null);
  const [pickingSlotKey, setPickingSlotKey] = useState<string | null>(null);
  const [addedBundle, setAddedBundle] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Apply AI Recommended Setup from Modal
  const handleApplyAIRecommendation = (result: {
    archetypeTitle: string;
    rationale: string;
    allocatedBudget: number;
    selections: Record<string, string | null>;
  }) => {
    setTargetBudget(result.allocatedBudget);
    setAiRationale({
      title: result.archetypeTitle,
      text: result.rationale,
    });

    const newSelections: Record<string, Product | null> = {
      machine: null,
      display: null,
      peripherals: null,
      power: null,
    };

    SETUP_SLOTS.forEach((slot) => {
      const selectedId = result.selections[slot.key];
      if (selectedId) {
        const found = initialProducts.find((p) => p.id === selectedId);
        newSelections[slot.key] = found || null;
      }
    });

    setSelectedItems(newSelections);
  };

  const autoAssignArchetype = (archetypeId: string) => {
    setActiveArchetype(archetypeId);
    setAiRationale(null);
    const arch = PRESET_ARCHETYPES.find((a) => a.id === archetypeId)!;
    setTargetBudget(arch.recommendedBudget);

    const newSelections: Record<string, Product | null> = {};

    SETUP_SLOTS.forEach((slot) => {
      const keywords = arch.slotKeywords[slot.key as keyof typeof arch.slotKeywords] || [];
      const match = initialProducts.find((p) => {
        const catMatch =
          slot.categoryFilter.includes(p.category?.toLowerCase() || "") ||
          p.category?.toLowerCase() === "all";
        const titleLower = p.title.toLowerCase();
        const kwMatch = keywords.some((kw) => titleLower.includes(kw));
        return catMatch || kwMatch;
      });

      newSelections[slot.key] = match || null;
    });

    setSelectedItems(newSelections);
  };

  useMemo(() => {
    if (!selectedItems.machine && initialProducts.length > 0) {
      const firstMachine = initialProducts.find((p) =>
        ["laptops", "phones", "gaming"].includes(p.category?.toLowerCase() || "")
      );
      if (firstMachine) {
        setSelectedItems((prev) => ({ ...prev, machine: firstMachine }));
      }
    }
  }, [initialProducts, selectedItems.machine]);

  const totalBundlePrice = useMemo(() => {
    return Object.values(selectedItems).reduce((sum, item) => {
      return sum + (item ? Number(item.price) || 0 : 0);
    }, 0);
  }, [selectedItems]);

  const budgetUsagePercent = Math.min(100, Math.round((totalBundlePrice / (targetBudget || 1)) * 100));
  const isOverBudget = totalBundlePrice > targetBudget;

  const handleAddBundleToCart = () => {
    const itemsToAdd = Object.values(selectedItems).filter(Boolean) as Product[];
    if (itemsToAdd.length === 0) return;

    itemsToAdd.forEach((product) => {
      addItem({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        image: resolveFirstImage(product.images) || "",
        seller_id: product.seller_id,
        condition: product.condition,
      });
    });

    setAddedBundle(true);
    setTimeout(() => setAddedBundle(false), 2500);
  };

  const handleShareSetup = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const activeSlotConfig = SETUP_SLOTS.find((s) => s.key === pickingSlotKey);
  const slotCandidates = useMemo(() => {
    if (!activeSlotConfig) return [];
    return initialProducts.filter((p) => {
      const cat = p.category?.toLowerCase() || "";
      return (
        activeSlotConfig.categoryFilter.includes(cat) ||
        p.title.toLowerCase().includes(activeSlotConfig.key)
      );
    });
  }, [initialProducts, activeSlotConfig]);

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* 1. Feature Hero Header with AI Assistant Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Setup Customizer • Abuja Verified Stock
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Build Your Perfect Tech Setup
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Configure matching machines, displays, input gear, and power backups. Mix and match verified listings
            across Banex, Emab, and Wuse 2 with TechTrust escrow safety.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* AI Trigger Modal */}
          <AIBuildAssistantModal onApplyRecommendation={handleApplyAIRecommendation} />

          <Button
            variant="outline"
            size="sm"
            onClick={handleShareSetup}
            className="text-xs font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied" : "Share"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleAddBundleToCart}
            disabled={totalBundlePrice === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-2 shadow-xs cursor-pointer"
          >
            {addedBundle ? (
              <>
                <Check className="w-4 h-4" /> Added to Cart!
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" /> Add Bundle to Cart
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Recommendation Explanation Banner */}
      {aiRationale && (
        <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-blue-900/40 border border-purple-500/40 rounded-3xl p-5 sm:p-6 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] uppercase font-black tracking-wider text-purple-400">
                BenchTech AI Rig Architect Recommendation
              </span>
            </div>
            <button
              onClick={() => setAiRationale(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <h3 className="text-base font-black text-white">{aiRationale.title}</h3>
          <p className="text-xs text-purple-100/90 leading-relaxed max-w-4xl">
            {aiRationale.text}
          </p>
        </div>
      )}

      {/* 2. Archetype / Persona Selector Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            1. Select Your Workflow Profile
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold hidden sm:inline">
            Auto-seeds compatible specs &amp; peripherals
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRESET_ARCHETYPES.map((arch) => {
            const Icon = arch.icon;
            const isSelected = activeArchetype === arch.id;

            return (
              <button
                key={arch.id}
                type="button"
                onClick={() => autoAssignArchetype(arch.id)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition cursor-pointer ${
                  isSelected
                    ? "bg-blue-50/50 dark:bg-blue-950/40 border-blue-600 ring-1 ring-blue-600 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0.2">Active</Badge>}
                </div>

                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">{arch.label}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{arch.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Budget Allocation & Real-time Gauge */}
<div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
        2. Budget Allocation
      </span>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
          ₦{totalBundlePrice.toLocaleString()}
        </span>
        <span className="text-xs text-slate-400">
          of ₦{targetBudget.toLocaleString()} target
        </span>
      </div>
    </div>

    {/* Direct Custom Budget Input & Quick Presets */}
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <span className="absolute left-3 top-2 text-xs font-black text-slate-400">₦</span>
        <input
          type="number"
          min="50000"
          step="25000"
          value={targetBudget || ''}
          onChange={(e) => setTargetBudget(Math.max(0, Number(e.target.value)))}
          placeholder="Target budget..."
          className="w-36 sm:w-44 pl-7 pr-3 py-1.5 text-xs font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {BUDGET_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => setTargetBudget(preset.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              targetBudget === preset.value
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  </div>

  <div className="space-y-1.5">
    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${
          isOverBudget ? "bg-amber-500" : "bg-emerald-500"
        }`}
        style={{ width: `${budgetUsagePercent}%` }}
      />
    </div>
    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
      <span>{budgetUsagePercent}% of budget assigned</span>
      <span className={isOverBudget ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
        {isOverBudget
          ? `₦${(totalBundlePrice - targetBudget).toLocaleString()} over budget`
          : `₦${(targetBudget - totalBundlePrice).toLocaleString()} remaining`}
      </span>
    </div>
  </div>
</div>

      {/* 4. The 4 Workbench Setup Slots */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            3. Setup Component Slots
          </span>
          <span className="text-xs text-slate-400">Click any card to swap with live Abuja inventory</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SETUP_SLOTS.map((slot) => {
            const SlotIcon = slot.icon;
            const currentItem = selectedItems[slot.key];
            const firstImg = resolveFirstImage(currentItem?.images);

            return (
              <div
                key={slot.key}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition group"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <SlotIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">{slot.name}</h3>
                      <p className="text-[9px] text-slate-400">{slot.description}</p>
                    </div>
                  </div>

                  {currentItem && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedItems((prev) => ({ ...prev, [slot.key]: null }))
                      }
                      title="Remove item"
                      className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {currentItem ? (
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="relative w-full aspect-4/3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2">
                      {firstImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={firstImg}
                          alt={currentItem.title}
                          className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-300" />
                      )}
                      <Badge className="absolute top-2 left-2 bg-slate-900/80 text-white text-[8px] uppercase">
                        {currentItem.condition?.replace("_", " ") || "Refurbished"}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                        {currentItem.title}
                      </h4>
                      <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                        ₦{Number(currentItem.price).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Store className="w-3 h-3 text-slate-400" />
                        <span>{currentItem.profiles?.business_name || "Abuja Vendor"}</span>
                        <span>•</span>
                        <span>{currentItem.profiles?.district || "Abuja"}</span>
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPickingSlotKey(slot.key)}
                      className="w-full text-[11px] font-bold rounded-xl h-8 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer mt-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Swap Hardware
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No device selected</p>
                      <p className="text-[10px] text-slate-400">Select matching item in Abuja</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setPickingSlotKey(slot.key)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-8 px-4 cursor-pointer"
                    >
                      Pick Device
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Bottom Bundle Guarantee Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-900/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-sm sm:text-base">TechTrust Bundle Inspection Guarantee</h3>
          </div>
          <p className="text-xs text-indigo-200 leading-relaxed">
            All devices in your custom setup are held under TechTrust escrow. Inspect each piece in person at Banex,
            Emab, or upon delivery before vendor payout is cleared.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="text-right hidden sm:block pr-2">
            <span className="text-[10px] text-indigo-300 block uppercase font-bold">Bundle Total</span>
            <span className="text-xl font-black">₦{totalBundlePrice.toLocaleString()}</span>
          </div>

          <Button
            size="lg"
            onClick={handleAddBundleToCart}
            disabled={totalBundlePrice === 0}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm h-12 px-6 rounded-2xl shadow-lg cursor-pointer gap-2"
          >
            {addedBundle ? (
              <>
                <Check className="w-4 h-4" /> Added to Cart!
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" /> Add All Selected ({Object.values(selectedItems).filter(Boolean).length}) to Cart
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 6. Hardware Swap Modal */}
      {pickingSlotKey && activeSlotConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setPickingSlotKey(null)}
          />

          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4 max-h-[85vh] flex flex-col text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-base">Select {activeSlotConfig.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Available in Abuja hardware plazas • {slotCandidates.length} matching units
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickingSlotKey(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 [scrollbar-width:thin]">
              {slotCandidates.length > 0 ? (
                slotCandidates.map((product) => {
                  const firstImg = resolveFirstImage(product.images);
                  const isCurrent = selectedItems[pickingSlotKey]?.id === product.id;

                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        setSelectedItems((prev) => ({ ...prev, [pickingSlotKey]: product }));
                        setPickingSlotKey(null);
                      }}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                        isCurrent
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                          {firstImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={firstImg} alt={product.title} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <h4 className="font-bold text-xs truncate">{product.title}</h4>
                          <p className="text-xs font-black text-blue-600 dark:text-blue-400">
                            ₦{Number(product.price).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {product.profiles?.business_name || "Vendor"} • {product.profiles?.district || "Abuja"}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className={`text-xs font-bold rounded-xl h-8 px-3 shrink-0 cursor-pointer ${
                          isCurrent
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {isCurrent ? "Selected" : "Select"}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No matching devices found in this category.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}