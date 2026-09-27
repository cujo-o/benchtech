"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SaveButton } from "@/components/SaveButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Laptop,
  Gamepad2,
  Headphones,
  Camera,
  Network,
  Home as HomeIcon,
  Watch,
  Tablet,
  Monitor,
  Grid,
  MapPin,
  Sparkles,
  Package,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  HardDrive,
  Cpu,
  BatteryCharging,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Catalog", icon: Grid },
  { id: "phones", label: "Phones", icon: Smartphone },
  { id: "laptops", label: "Laptops", icon: Laptop },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "tablets", label: "Tablets", icon: Tablet },
  { id: "accessories", label: "Accessories", icon: Headphones },
  { id: "cameras", label: "Cameras", icon: Camera },
  { id: "networking", label: "Networking", icon: Network },
  { id: "monitors", label: "Monitors", icon: Monitor },
  { id: "wearables", label: "Wearables", icon: Watch },
  { id: "smarthome", label: "Smart Home", icon: HomeIcon },
];

const PHONE_BRANDS = ["Apple", "Samsung", "Google", "Xiaomi", "OnePlus", "Tecno", "Infinix"];
const LAPTOP_BRANDS = ["Apple", "Dell", "HP", "Lenovo", "ASUS", "Acer", "Microsoft"];
const GENERAL_BRANDS = ["Apple", "Samsung", "Sony", "Dell", "HP", "Lenovo", "Logitech", "Canon", "LG"];

const PHONE_STORAGE = ["64GB", "128GB", "256GB", "512GB", "1TB"];
const LAPTOP_RAM = ["8GB", "16GB", "32GB", "64GB+"];
const LAPTOP_STORAGE = ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"];
const PROCESSORS = ["Apple M1/M2/M3", "Core i5", "Core i7", "Core i9", "Ryzen 5", "Ryzen 7"];
const BATTERY_HEALTH = ["90%+", "85%+", "80%+"];

const CONDITIONS = [
  { id: "brand_new", label: "Brand New (Sealed)" },
  { id: "open_box", label: "Open Box / Mint" },
  { id: "refurbished", label: "Refurbished" },
  { id: "used", label: "Clean Fairly Used" },
];

const ABUJA_HUBS = ["Banex Plaza", "Emab Plaza", "Wuse 2", "Garki", "CBD", "Maitama", "Gwarinpa", "Apo"];

const PRICE_BUCKETS = [
  { label: "Under ₦150k", min: 0, max: 150000 },
  { label: "₦150k – ₦350k", min: 150000, max: 350000 },
  { label: "₦350k – ₦750k", min: 350000, max: 750000 },
  { label: "₦750k – ₦1.5M", min: 750000, max: 1500000 },
  { label: "Above ₦1.5M", min: 1500000, max: 999999999 },
];

export function ProductsCatalogClient({ initialProducts }: { initialProducts: any[] }) {
  const searchParams = useSearchParams();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all");
  const [searchQuery] = useState<string>(searchParams.get("q") || "");
  const deferredSearch = useDeferredValue(searchQuery);

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedHubs, setSelectedHubs] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number; label: string } | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Re-integrated specs states
  const [selectedRam, setSelectedRam] = useState<string[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
  const [selectedProcessors, setSelectedProcessors] = useState<string[]>([]);
  const [selectedBatteryHealth, setSelectedBatteryHealth] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState<"featured" | "newest" | "price_low" | "price_high">("featured");

  const [openSections, setOpenSections] = useState({
    price: true,
    brand: true,
    condition: true,
    specs: true,
    hub: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [drawerOpen]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activeBrands = useMemo(() => {
    if (selectedCategory === "phones") return PHONE_BRANDS;
    if (selectedCategory === "laptops") return LAPTOP_BRANDS;
    return GENERAL_BRANDS;
  }, [selectedCategory]);

  const filteredProducts = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();

    return initialProducts
      .filter((item) => {
        if (selectedCategory !== "all" && item.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
        if (q) {
          const matchTitle = item.title?.toLowerCase().includes(q);
          const matchBrand = item.brand?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchBrand && !matchDesc) return false;
        }
        if (selectedBrands.length > 0 && !selectedBrands.some((b) => item.brand?.toLowerCase() === b.toLowerCase())) {
          return false;
        }
        if (selectedConditions.length > 0 && !selectedConditions.includes(item.condition)) {
          return false;
        }
        if (selectedHubs.length > 0) {
          const district = item.profiles?.district || "";
          if (!selectedHubs.some((h) => district.toLowerCase().includes(h.toLowerCase()))) {
            return false;
          }
        }
        if (selectedPriceRange) {
          const price = Number(item.price) || 0;
          if (price < selectedPriceRange.min || price > selectedPriceRange.max) {
            return false;
          }
        }
        if (verifiedOnly && item.profiles?.tech_trust_status !== "verified") {
          return false;
        }

        // Live specs matching
        if (selectedRam.length > 0) {
          const itemRam = item.specs?.ram || "";
          const content = `${item.title} ${item.description} ${itemRam}`.toUpperCase();
          if (!selectedRam.some((r) => content.includes(r.replace("+", "").toUpperCase()))) {
            return false;
          }
        }
        if (selectedStorage.length > 0) {
          const itemStorage = item.specs?.storage || "";
          const content = `${item.title} ${item.description} ${itemStorage}`.toUpperCase();
          if (!selectedStorage.some((s) => content.includes(s.replace(" SSD", "").toUpperCase()))) {
            return false;
          }
        }
        if (selectedProcessors.length > 0) {
          const itemProc = item.specs?.processor || "";
          const content = `${item.title} ${item.description} ${itemProc}`.toLowerCase();
          if (!selectedProcessors.some((p) => content.includes(p.toLowerCase().replace("apple ", "")))) {
            return false;
          }
        }
        if (selectedBatteryHealth.length > 0) {
          const healthNum = parseInt(item.specs?.battery_health || "0");
          const meetsThreshold = selectedBatteryHealth.some((threshold) => healthNum >= parseInt(threshold));
          if (!meetsThreshold && item.specs?.battery_health) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_low") return Number(a.price) - Number(b.price);
        if (sortBy === "price_high") return Number(b.price) - Number(a.price);
        if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      });
  }, [
    initialProducts,
    selectedCategory,
    deferredSearch,
    selectedBrands,
    selectedConditions,
    selectedHubs,
    selectedPriceRange,
    verifiedOnly,
    selectedRam,
    selectedStorage,
    selectedProcessors,
    selectedBatteryHealth,
    sortBy,
  ]);

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    selectedBrands.length +
    selectedConditions.length +
    selectedHubs.length +
    selectedRam.length +
    selectedStorage.length +
    selectedProcessors.length +
    selectedBatteryHealth.length +
    (selectedPriceRange ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedConditions([]);
    setSelectedHubs([]);
    setSelectedPriceRange(null);
    setVerifiedOnly(false);
    setSelectedRam([]);
    setSelectedStorage([]);
    setSelectedProcessors([]);
    setSelectedBatteryHealth([]);
  };

  const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  // Reusable Filter Content (Used in Desktop Sidebar AND Mobile Drawer)
  const FilterControls = () => (
    <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
      {/* Verified Dealers Only */}
      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl">
        <label className="flex items-center gap-2.5 cursor-pointer font-bold text-emerald-950 dark:text-emerald-200 w-full">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span className="flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Verified Dealers Only
          </span>
        </label>
      </div>

      {/* Price Budget */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2"
        >
          <span>Price Budget</span>
          {openSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.price && (
          <div className="space-y-1">
            {PRICE_BUCKETS.map((b, i) => {
              const isSelected = selectedPriceRange?.min === b.min && selectedPriceRange?.max === b.max;
              return (
                <label key={i} className="flex items-center gap-2 cursor-pointer py-1 hover:text-blue-600 dark:hover:text-blue-400 transition">
                  <input
                    type="radio"
                    name="price_bucket"
                    checked={isSelected}
                    onChange={() => setSelectedPriceRange(isSelected ? null : b)}
                    onClick={() => {
                      if (isSelected) setSelectedPriceRange(null);
                    }}
                    className="w-3.5 h-3.5 text-blue-600"
                  />
                  <span className={isSelected ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}>
                    {b.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Brands */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <button
          onClick={() => toggleSection("brand")}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2"
        >
          <span className="capitalize">{selectedCategory !== "all" ? `${selectedCategory} Brands` : "Brands"}</span>
          {openSections.brand ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.brand && (
          <div className="grid grid-cols-2 gap-1.5">
            {activeBrands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleItem(selectedBrands, setSelectedBrands, brand)}
                  className="w-3.5 h-3.5 rounded text-blue-600"
                />
                <span className={selectedBrands.includes(brand) ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}>
                  {brand}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Hardware Specs Filter */}
      {selectedCategory === "phones" && (
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 space-y-3">
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1.5 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" /> Internal Storage
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PHONE_STORAGE.map((storage) => {
                const isSelected = selectedStorage.includes(storage);
                return (
                  <button
                    key={storage}
                    type="button"
                    onClick={() => toggleItem(selectedStorage, setSelectedStorage, storage)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {storage}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1.5 flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" /> Battery Health
            </span>
            <div className="flex flex-wrap gap-1.5">
              {BATTERY_HEALTH.map((bh) => {
                const isSelected = selectedBatteryHealth.includes(bh);
                return (
                  <button
                    key={bh}
                    type="button"
                    onClick={() => toggleItem(selectedBatteryHealth, setSelectedBatteryHealth, bh)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {bh}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedCategory === "laptops" && (
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 space-y-3">
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-600" /> RAM Memory
            </span>
            <div className="flex flex-wrap gap-1.5">
              {LAPTOP_RAM.map((ram) => {
                const isSelected = selectedRam.includes(ram);
                return (
                  <button
                    key={ram}
                    type="button"
                    onClick={() => toggleItem(selectedRam, setSelectedRam, ram)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {ram}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1.5 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" /> SSD Storage
            </span>
            <div className="flex flex-wrap gap-1.5">
              {LAPTOP_STORAGE.map((storage) => {
                const isSelected = selectedStorage.includes(storage);
                return (
                  <button
                    key={storage}
                    type="button"
                    onClick={() => toggleItem(selectedStorage, setSelectedStorage, storage)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {storage}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Condition */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <button
          onClick={() => toggleSection("condition")}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2"
        >
          <span>Device Condition</span>
          {openSections.condition ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.condition && (
          <div className="space-y-1">
            {CONDITIONS.map((c) => (
              <label key={c.id} className="flex items-center gap-2 cursor-pointer py-1 hover:text-blue-600 dark:hover:text-blue-400 transition">
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(c.id)}
                  onChange={() => toggleItem(selectedConditions, setSelectedConditions, c.id)}
                  className="w-3.5 h-3.5 rounded text-blue-600"
                />
                <span className={selectedConditions.includes(c.id) ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}>
                  {c.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Hub Location */}
      <div>
        <button
          onClick={() => toggleSection("hub")}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2"
        >
          <span>Abuja Hub Location</span>
          {openSections.hub ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.hub && (
          <div className="grid grid-cols-2 gap-1">
            {ABUJA_HUBS.map((hub) => (
              <label key={hub} className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition">
                <input
                  type="checkbox"
                  checked={selectedHubs.includes(hub)}
                  onChange={() => toggleItem(selectedHubs, setSelectedHubs, hub)}
                  className="w-3.5 h-3.5 rounded text-blue-600"
                />
                <span className={selectedHubs.includes(hub) ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}>
                  {hub}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Mobile Slide-out Drawer Portal
  const filterDrawerPortal = (
    <div className="fixed inset-0 z-[9999] flex lg:hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setDrawerOpen(false)}
      />

      <div className="relative ml-auto w-80 max-w-[85vw] h-dvh bg-white dark:bg-slate-900 z-[10000] shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filter Catalog
            </span>
            {activeFilterCount > 0 && (
              <Badge className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {activeFilterCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline mr-1"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
          <FilterControls />
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={clearAllFilters} className="w-1/3 text-xs font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
            Reset
          </Button>
          <Button size="sm" onClick={() => setDrawerOpen(false)} className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 shadow-xs cursor-pointer">
            Show ({filteredProducts.length})
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <main className="p-3 sm:p-5 lg:p-6 space-y-4 max-w-[1600px] mx-auto w-full">
        
        {/* 1. Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  clearAllFilters();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all shadow-2xs ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Top Toolbar */}
        <div className="bg-white dark:bg-slate-900 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
              {filteredProducts.length} {filteredProducts.length === 1 ? "Device" : "Devices"}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              available in Abuja
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort options"
                className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="featured">Featured First</option>
                <option value="newest">Newest Listed</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            {/* Mobile Filter Button (Hidden on PC desktop) */}
            <Button
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer border border-transparent dark:border-slate-700"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* 3. Main Body: Split Desktop Sidebar (PC) + Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* PC Desktop Filter Sidebar (Persistent on PC, hidden on mobile) */}
          <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filter Devices
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            <FilterControls />
          </aside>

          {/* Catalog Grid Area (9 columns on PC, full on mobile) */}
          <div className="lg:col-span-9 space-y-4 min-w-0">
            
            {/* Active Filters Bar */}
            {activeFilterCount > 0 && (
              <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1">
                  Active filters:
                </span>

                {verifiedOnly && (
                  <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
                    Verified Only
                    <X className="w-3 h-3 cursor-pointer hover:text-emerald-900" onClick={() => setVerifiedOnly(false)} />
                  </Badge>
                )}

                {selectedPriceRange && (
                  <Badge className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
                    {selectedPriceRange.label}
                    <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setSelectedPriceRange(null)} />
                  </Badge>
                )}

                {selectedBrands.map((b) => (
                  <Badge key={b} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
                    {b}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => toggleItem(selectedBrands, setSelectedBrands, b)} />
                  </Badge>
                ))}

                <button onClick={clearAllFilters} className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline ml-1">
                  Reset All
                </button>
              </div>
            )}

            {/* Product Cards Grid: 2 cols on mobile, 3 cols on PC */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4.5 min-w-0">
                {filteredProducts.map((item) => {
                  const isFeatured = item.is_featured && item.featured_until && new Date(item.featured_until) > new Date();

                  return (
                    <div
                      key={item.id}
                      className="relative group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between min-w-0 w-full"
                    >
                      {/* Floating Badges & Save Target */}
                      <div className="absolute top-2 inset-x-2 flex items-start justify-between z-10 pointer-events-none">
                        <div className="flex flex-col gap-1 items-start max-w-[70%]">
                          {isFeatured && (
                            <span className="bg-blue-600 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                              <Sparkles className="w-2 h-2" /> Featured
                            </span>
                          )}
                          <span className="bg-slate-950/80 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded backdrop-blur-xs truncate max-w-full">
                            {item.condition?.replace("_", " ") || "Refurbished"}
                          </span>
                        </div>

                        <div className="pointer-events-auto shrink-0">
                          <SaveButton product={item} />
                        </div>
                      </div>

                      {/* Card Content Link */}
                      <Link href={`/products/${item.id}`} className="flex-1 flex flex-col min-w-0">
                        {/* Absolute Protected Image Frame (Prevents all zoom blowouts) */}
                        <div className="relative w-full aspect-square bg-slate-100/70 dark:bg-slate-800/40 overflow-hidden border-b border-slate-100 dark:border-slate-800/80">
                          {item.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              loading="lazy"
                              decoding="async"
                              className="absolute inset-0 w-full h-full object-contain p-3.5 group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2 min-w-0">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                              <span className="truncate max-w-[80px] sm:max-w-[100px]">
                                {item.brand || "Device"}
                              </span>
                              {item.profiles?.district && (
                                <span className="flex items-center gap-0.5 normal-case font-medium text-slate-500 truncate max-w-[75px]">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  {item.profiles.district.split(" ")[0]}
                                </span>
                              )}
                            </div>

                            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                              {item.title}
                            </h3>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                              ₦{Number(item.price).toLocaleString()}
                            </p>
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                              Inspect <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                    No gadgets found matching your filters
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try loosening your budget range, changing brands, or clearing active filters.
                  </p>
                </div>
                <Button size="sm" onClick={clearAllFilters} variant="outline" className="text-xs font-bold rounded-xl mt-2 border-slate-200 dark:border-slate-700">
                  Clear Active Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 4. Portal Filter Drawer for Mobile Devices */}
        {drawerOpen && mounted ? createPortal(filterDrawerPortal, document.body) : null}
      </main>
    </div>
  );
}