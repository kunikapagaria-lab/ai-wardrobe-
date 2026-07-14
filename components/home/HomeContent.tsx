"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Camera,
  Sparkles,
  Palette,
  CalendarDays,
  Wand2,
  ArrowRight,
  Sun,
  CloudRain,
  Wind,
  Sparkle,
  Shirt,
  Bookmark,
} from "lucide-react";
import { useWardrobeStore } from "@/store/wardrobe";

// Types
interface MockItem {
  id: string;
  name: string;
  category: "top" | "bottom" | "outerwear" | "shoes";
  color: string;
  colorName: string;
  style: string;
  image: string;
}

// Mock Database — illustrative demo data for the marketing sections below.
// Photos are real product images (curated once via product search), not
// generic icons, so the Lookbook/Planner previews below look like actual
// garments rather than placeholder swatches.
const MOCK_ITEMS: MockItem[] = [
  { id: "t1", name: "Sage Tee", category: "top", color: "#5F6F52", colorName: "Sage", style: "Casual", image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQtjRIq_QCdxZyp4kDtQrc2gGyPvjTmA3VedSYKbR5rpfsg2vP3kwe2FyGME8-qmH6YHSpfEBZ5xKoRxhB5YL9yHRXTv751mdyd5fFOst_Kc8fetZd8dmRwWEM" },
  { id: "t2", name: "Cream Knit Sweater", category: "top", color: "#E8E0C8", colorName: "Cream", style: "Cozy", image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTgMIG_YGLGVPJxhcRGysJQV7i8B2zY1hEsSqz7-EFKypvPmxF6vVeRSkMvKxfkwijRx3G7KdpqR8lkvy8f0gZV3IfyUjoNKuDO0WWxTbjhMtnVf_RGJh0HfA" },
  { id: "t3", name: "Charcoal Button-up", category: "top", color: "#2C2C2A", colorName: "Charcoal", style: "Smart", image: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTOQ-OJGySJg1rRlzg80aKZcyi3FPYgQiTuWR263wDykIhGevDZRrvEEgzJXp8nMRyZSQBmbUKA" },

  { id: "b1", name: "Sand Chinos", category: "bottom", color: "#8A8880", colorName: "Sand", style: "Smart Casual", image: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRt_ryK8mx5is_O3RpJsYvv-4IHFYOK-bXqqZcZFOOR3sfaebYe9MwOcHH6sBVwqEk0X7bYlV-IIboCaH3Qjyb2PKbr9iPT0CkG-q6OtYmSmFwB0gTIc1qgBw" },
  { id: "b2", name: "Olive Cargo Pants", category: "bottom", color: "#5F6F52", colorName: "Olive", style: "Casual", image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRrm2NN2SwErKkSPmuLDzj1tnq55wzd_uQOdIrzDSnyseIv0Y936PXqM1NnPRlvwbmoQ7POWob8i3klYN5K8ameVrxpl9_AgcGqXsGkITE" },
  { id: "b3", name: "Dark Denim Jeans", category: "bottom", color: "#2C2C2A", colorName: "Dark Denim", style: "Classic", image: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTVLBHnjVOYKpHyjFYVIhOb0xOTWYST04XT1POfASPLEY579J9Ikuud5KNvPcdVGO8PGvjI-Te2CcETQLpGhLdTmdyTg6wiY9Ups46c01br4Ic8duZZ2HHcJg" },

  { id: "o1", name: "Terracotta Chore Jacket", category: "outerwear", color: "#C97B4A", colorName: "Terracotta", style: "Workwear", image: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQSKadndfMrxzbuDaldrXzsopq67dnf40ACyy-Po0a90Ck80Ck" },
  { id: "o2", name: "Sage Trench Coat", category: "outerwear", color: "#5F6F52", colorName: "Sage", style: "Elegant", image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQA-C7HytX_HtTBXVV0pSRhgdoc0K2TbpRKmGLTYit9Lh_qPtUfV6wPMshPvWD4lUKxn8dLW563" },
  { id: "o3", name: "Crimson Bomber", category: "outerwear", color: "#B85C6B", colorName: "Crimson", style: "Sporty", image: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRpwNGSM8MApVPxagQK5VJrKQWyczd0jh4eKilmm6AGB17KXDrwNqQqTq1MxOYLCBoRJRdIqIw1Iw" },

  { id: "s1", name: "Minimalist Sneakers", category: "shoes", color: "#D3D1C7", colorName: "Off-White", style: "Minimalist", image: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRdXJ-KKz4KfK_D9GSd_1hV3AX1fG0JKw5YHP0t-a5aEqnE4_lT6ThTjGWDYXzga7yYr9YSeJU8mVgir3d1jBs92NHbgqhfprT32npP2n2j" },
  { id: "s2", name: "Leather Chelsea Boots", category: "shoes", color: "#C97B4A", colorName: "Tan Leather", style: "Classic", image: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRrbQWCjz8r8FNzG3bJUEG7-H9cQa7FEPyZBxHvPF-4qlo6rq72f5nD4QSelsVG7pkNjGrtimq9teI9OzoCKGro0jM524FBkmJrwMRimD-vK1brNbf4CCTqDQ" },
  { id: "s3", name: "Black Derbies", category: "shoes", color: "#2C2C2A", colorName: "Black", style: "Formal", image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcT7hcWYv0I0xuv4evECtTmfftt0Z-MO7hdkoUVqgIsbbiQw5B57f1VxDZT05yq9Sv4xhTcfkxU" },
];

const OCCASIONS = [
  {
    id: "office",
    label: "🏢 Smart Office",
    desc: "Polished and professional, yet comfortable enough for a long day.",
    why: "Monochromatic base layer paired with a structured blazer/trench, finished with formal footwear.",
    items: ["t3", "b1", "o2", "s3"],
    score: 96,
  },
  {
    id: "date",
    label: "☕ Casual Date",
    desc: "Effortlessly stylish, warm, and inviting tones.",
    why: "Earth tone palette blending sage and terracotta for a cozy, smart-casual aesthetic.",
    items: ["t2", "b3", "o1", "s2"],
    score: 92,
  },
  {
    id: "weekend",
    label: "🛹 Weekend Chill",
    desc: "Relaxed streetwear built for maximum comfort and utility.",
    items: ["t1", "b2", "o3", "s1"],
    why: "Loose silhouette with cargo elements, light sage top, and minimalist sneakers.",
    score: 89,
  },
  {
    id: "dinner",
    label: "🥂 Gallery Dinner",
    desc: "A sleek, contemporary, and dramatic look for evening events.",
    why: "A dark charcoal button-up matched with dark denim, contrasted with clean minimalist sneakers.",
    items: ["t3", "b3", "o1", "s1"],
    score: 95,
  },
];

const CALENDAR_DAYS = [
  { day: "Mon", weather: Sun, temp: "24°C", occasion: "Weekly Sync", outfit: ["t3", "b1", "s3"], costPerWear: "$4.20" },
  { day: "Tue", weather: CloudRain, temp: "16°C", occasion: "Client Lunch", outfit: ["t2", "b3", "o2", "s2"], costPerWear: "$8.50" },
  { day: "Wed", weather: Wind, temp: "18°C", occasion: "Coffee Run", outfit: ["t1", "b2", "s1"], costPerWear: "$1.10" },
  { day: "Thu", weather: Sun, temp: "22°C", occasion: "Focus Day", outfit: ["t2", "b1", "s1"], costPerWear: "$3.40" },
  { day: "Fri", weather: CloudRain, temp: "15°C", occasion: "Date Night", outfit: ["t3", "b3", "o1", "s2"], costPerWear: "$6.80" },
];

const STEPS = [
  { icon: Camera, title: "Photograph a piece", desc: "Snap any item — or a full outfit — and drop it in." },
  { icon: Wand2, title: "AI tags & cuts it out", desc: "Category, color, style, occasion, season, plus a clean product-style cutout." },
  { icon: Sparkles, title: "Get styled", desc: "Occasion outfits, unexpected mix & match pairings, and a wardrobe you understand." },
];

const FEATURES = [
  { icon: Sparkles, title: "Style AI", desc: "Occasion-based outfit recommendations and AI-curated mix & match pairings from what you already own." },
  { icon: Palette, title: "Palette intelligence", desc: "See your wardrobe's color story at a glance — and where the gaps are." },
  { icon: CalendarDays, title: "Outfit planner", desc: "Plan looks ahead on a calendar, and track wear count and cost-per-wear over time." },
];

const SWATCHES = [
  { color: "#2C2C2A", name: "Charcoal/Black", percentage: "35%" },
  { color: "#8A8880", name: "Sand/Grey", percentage: "20%" },
  { color: "#D3D1C7", name: "Off-White", percentage: "15%" },
  { color: "#5F6F52", name: "Sage/Olive", percentage: "15%" },
  { color: "#C97B4A", name: "Terracotta", percentage: "10%" },
  { color: "#B85C6B", name: "Crimson", percentage: "5%" },
];

export function HomeContent({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  // Lookbook State
  const [activeOccasion, setActiveOccasion] = useState(OCCASIONS[0]);

  // Palette State
  const [selectedColorFilter, setSelectedColorFilter] = useState<string | null>(null);

  const filteredItemsByColor = selectedColorFilter
    ? MOCK_ITEMS.filter((i) => i.color === selectedColorFilter)
    : MOCK_ITEMS;

  // Real account data — only fetched/shown once signed in, so this reflects
  // whatever the user has actually saved (wardrobe items, wishlist looks).
  const { items, wishlistItems, fetchAll } = useWardrobeStore();
  useEffect(() => {
    if (isLoggedIn) fetchAll();
  }, [isLoggedIn, fetchAll]);

  return (
    <div className="font-sans wardrobe-theme">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border"
          style={{ background: "rgba(168,112,61,0.14)", color: "var(--w-primary)", borderColor: "var(--w-border)" }}
        >
          <Sparkle className="w-3.5 h-3.5 fill-current" />
          Next-Gen AI Wardrobe Management
        </span>
        <h1 className="font-display text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6" style={{ color: "var(--w-text)" }}>
          Your closet, <em className="not-italic" style={{ color: "var(--w-primary)" }}>digitized & styled</em>.
        </h1>
        <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--w-text-muted)" }}>
          Upload photos of what you own. Let AI automatically crop, categorize, tag, and intelligently mix-and-match your wardrobe to spark new styling ideas.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href={isLoggedIn ? "/wardrobe" : "/login"}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold shadow-md transition-transform hover:scale-[1.02]"
            style={{ background: "var(--w-primary)", color: "var(--w-primary-text)" }}
          >
            {isLoggedIn ? "Go to Wardrobe" : "Get Started"}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/canvas"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold border transition-all hover:bg-white/5"
            style={{ borderColor: "var(--w-border)", color: "var(--w-text)" }}
          >
            Try the Canvas
          </Link>
        </div>
      </section>

      {/* Welcome back — real account data, only once signed in */}
      {isLoggedIn && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-4">
          <div className="rounded-2xl p-5 flex flex-wrap items-center gap-6 justify-between" style={{ background: "var(--w-card)" }}>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(168,112,61,0.16)" }}>
                  <Shirt className="w-4.5 h-4.5" style={{ color: "var(--w-primary)" }} />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none" style={{ color: "var(--w-card-text)" }}>{items.length}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--w-card-text-muted)" }}>Items in your closet</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(168,112,61,0.16)" }}>
                  <Bookmark className="w-4.5 h-4.5" style={{ color: "var(--w-primary)" }} />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none" style={{ color: "var(--w-card-text)" }}>{wishlistItems.length}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--w-card-text-muted)" }}>Saved to your wishlist</p>
                </div>
              </div>
            </div>
            <Link href="/wardrobe" className="text-sm font-semibold" style={{ color: "var(--w-accent)" }}>
              Go to your wardrobe →
            </Link>
          </div>
        </section>
      )}


      {/* HOW IT WORKS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl font-bold text-center mb-12" style={{ color: "var(--w-text)" }}>How WardrobeAI Works</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative p-6 rounded-2xl shadow-sm"
              style={{ background: "var(--w-card)" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(139,94,60,0.14)" }}
              >
                <step.icon className="w-6 h-6" style={{ color: "var(--w-accent)" }} />
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--w-primary)" }}>Step {i + 1}</p>
              <h3 className="font-bold text-lg mb-2" style={{ color: "var(--w-card-text)" }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--w-card-text-muted)" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Occasion-Based Lookbook Generator */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-3xl font-bold mb-4" style={{ color: "var(--w-text)" }}>Occasion Lookbook</h2>
            <p style={{ color: "var(--w-text-muted)" }}>
              Browse recommended pairings generated automatically by WardrobeAI matching specific dress codes.
            </p>
          </div>

          {/* Occasion Switcher */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {OCCASIONS.map((occ) => {
              const isActive = activeOccasion.id === occ.id;
              return (
                <button
                  key={occ.id}
                  onClick={() => setActiveOccasion(occ)}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all border"
                  style={
                    isActive
                      ? { background: "var(--w-primary)", color: "var(--w-primary-text)", borderColor: "var(--w-primary)" }
                      : { background: "transparent", color: "var(--w-text-muted)", borderColor: "var(--w-border)" }
                  }
                >
                  {occ.label}
                </button>
              );
            })}
          </div>

          {/* Lookbook Display */}
          <div className="rounded-3xl shadow-xl p-8 max-w-4xl mx-auto" style={{ background: "var(--w-card)" }}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span
                  className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ color: "var(--w-rail)", background: "rgba(168,112,61,0.22)" }}
                >
                  {activeOccasion.score}% AI Match
                </span>
                <h3 className="text-2xl font-bold mt-4 mb-3" style={{ color: "var(--w-card-text)" }}>{activeOccasion.label} Outfit</h3>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--w-card-text-muted)" }}>
                  {activeOccasion.desc}
                </p>
                <div className="p-4 rounded-xl" style={{ background: "#F0E2CC" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--w-card-text-muted)" }}>Why it works:</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--w-card-text)" }}>{activeOccasion.why}</p>
                </div>
              </div>

              {/* Items in the look — real flat-lay photos, hanging */}
              <div className="grid grid-cols-2 gap-4 pt-3">
                {activeOccasion.items.map((itemId) => {
                  const item = MOCK_ITEMS.find((i) => i.id === itemId);
                  if (!item) return null;
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl overflow-hidden relative"
                      style={{ background: "#FFFFFF", border: "1px solid #E8DAC0" }}
                    >
                      <span
                        className="absolute top-2 right-2 z-10 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ color: "var(--w-card-text-muted)", background: "#F5F0E8" }}
                      >
                        {item.category}
                      </span>
                      <div className="h-24 flex items-center justify-center p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element -- external product-photo CDN */}
                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="px-3 pb-2.5 pt-1">
                        <p className="text-xs font-bold line-clamp-1" style={{ color: "var(--w-card-text)" }}>{item.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--w-card-text-muted)" }}>{item.style}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Interactive Palette Intelligence */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-3xl font-bold mb-4" style={{ color: "var(--w-text)" }}>Palette Intelligence</h2>
            <p style={{ color: "var(--w-text-muted)" }}>
              Filter the digitized wardrobe by color spectrum to view catalog inventory distribution.
            </p>
          </div>

          <div className="p-6 rounded-3xl shadow-md" style={{ background: "var(--w-card)" }}>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Palette swatches breakdown */}
              <div className="md:w-1/3 space-y-4 border-r pr-6" style={{ borderColor: "#E8DAC0" }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm" style={{ color: "var(--w-card-text)" }}>Wardrobe Color Story</h3>
                  {selectedColorFilter && (
                    <button
                      onClick={() => setSelectedColorFilter(null)}
                      className="text-xs font-semibold transition-colors"
                      style={{ color: "var(--w-card-text-muted)" }}
                    >
                      Show All
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {SWATCHES.map((sw) => {
                    const isSelected = selectedColorFilter === sw.color;
                    return (
                      <button
                        key={sw.color}
                        onClick={() => setSelectedColorFilter(sw.color)}
                        className="w-full flex items-center justify-between p-2 rounded-xl transition-all border"
                        style={
                          isSelected
                            ? { background: "#F0E2CC", borderColor: "#E0CBA0", fontWeight: 700 }
                            : { background: "transparent", borderColor: "transparent" }
                        }
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-lg border shadow-sm" style={{ background: sw.color }} />
                          <span className="text-xs text-left" style={{ color: "var(--w-card-text)" }}>{sw.name}</span>
                        </div>
                        <span className="text-xs font-medium" style={{ color: "var(--w-card-text-muted)" }}>{sw.percentage}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filtered items */}
              <div className="md:w-2/3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm" style={{ color: "var(--w-card-text)" }}>
                    {selectedColorFilter ? "Matching Garments" : "All Closet Items"}
                  </h3>
                  <span className="text-xs font-medium" style={{ color: "var(--w-card-text-muted)" }}>{filteredItemsByColor.length} items found</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredItemsByColor.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl flex items-center justify-between"
                      style={{ background: "#F0E2CC" }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border shadow-sm flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-xs font-bold truncate max-w-[100px]" style={{ color: "var(--w-card-text)" }}>{item.name}</span>
                      </div>
                      <span className="text-[9px] font-semibold capitalize" style={{ color: "var(--w-card-text-muted)" }}>{item.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Weekly Calendar Preview */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-3xl font-bold mb-4" style={{ color: "var(--w-text)" }}>Smart Closet Planner</h2>
            <p style={{ color: "var(--w-text-muted)" }}>
              Align outfits automatically with local weather forecasts and track your cost-per-wear stats over time.
            </p>
          </div>

          <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
            {CALENDAR_DAYS.map((cd) => (
              <div
                key={cd.day}
                className="min-w-[150px] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative"
                style={{ background: "var(--w-card)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm" style={{ color: "var(--w-card-text)" }}>{cd.day}</span>
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--w-card-text-muted)" }}>
                    <cd.weather className="w-3.5 h-3.5" style={{ color: "var(--w-card-text-muted)" }} />
                    <span>{cd.temp}</span>
                  </div>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--w-card-text-muted)" }}>
                  {cd.occasion}
                </div>

                {/* Outfit preview — mini flat-lay */}
                <div className="grid grid-cols-2 gap-1 mb-3">
                  {cd.outfit.map((id) => {
                    const item = MOCK_ITEMS.find((i) => i.id === id);
                    if (!item) return null;
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg flex items-center justify-center p-1"
                        style={{ background: "#FFFFFF", border: "1px solid #E8DAC0", aspectRatio: "1/1" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- external product-photo CDN */}
                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                      </div>
                    );
                  })}
                </div>

                {/* Cost per wear */}
                <div className="pt-2 mt-auto flex items-center justify-between text-[10px]" style={{ borderTop: "1px solid #E8DAC0" }}>
                  <span style={{ color: "var(--w-card-text-muted)" }}>Cost/Wear:</span>
                  <span className="font-bold" style={{ color: "var(--w-accent)" }}>{cd.costPerWear}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Built for how you dress - Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="font-display text-3xl font-bold text-center mb-12" style={{ color: "var(--w-text)" }}>Designed for the Modern Wardrobe</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="relative rounded-2xl p-6 shadow-sm" style={{ background: "var(--w-card)" }}>
              <f.icon className="w-6 h-6 mb-4" style={{ color: "var(--w-accent)" }} />
              <h3 className="font-bold text-lg mb-2" style={{ color: "var(--w-card-text)" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--w-card-text-muted)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-10" style={{ borderTop: "1px solid var(--w-border)" }}>
        <p className="text-xs text-center" style={{ color: "var(--w-text-muted)" }}>© 2026 WardrobeAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
