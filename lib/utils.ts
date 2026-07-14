import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { GraduationCap, Briefcase, Sun, Heart, Gem, Plane, PartyPopper, Coffee, Shirt, Footprints, Backpack, Glasses, ShoppingBag, CircleDot, Link as LinkIcon, Circle } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORY_LABELS: Record<string, string> = {
  top: "Tops", bottom: "Bottoms", dress: "Dresses", outerwear: "Outerwear",
  shoes: "Shoes", bag: "Bags", accessory: "Accessories", activewear: "Activewear",
  "co-ord": "Co-ords", jumpsuit: "Jumpsuits", traditional: "Traditional",
  necklace: "Necklaces", ring: "Rings", bracelet: "Bracelets", bangle: "Bangles", other: "Other",
};

export const CATEGORY_ICONS: Record<string, typeof Shirt> = {
  top: Shirt, bottom: Shirt, dress: Shirt, outerwear: Shirt,
  shoes: Footprints, bag: Backpack, accessory: Glasses, activewear: Shirt,
  "co-ord": Shirt, jumpsuit: Shirt, traditional: Shirt,
  necklace: Gem, ring: CircleDot, bracelet: LinkIcon, bangle: Circle, other: ShoppingBag,
};

export const WARDROBE_FILTERS = [
  { key: "all", label: "All" },
  { key: "top", label: "Tops" },
  { key: "bottom", label: "Bottoms" },
  { key: "dress", label: "Dresses" },
  { key: "outerwear", label: "Outerwear" },
  { key: "shoes", label: "Shoes" },
  { key: "bag", label: "Bags" },
  { key: "accessory", label: "Accessories" },
  { key: "necklace", label: "Necklaces" },
  { key: "ring", label: "Rings" },
  { key: "bracelet", label: "Bracelets" },
  { key: "bangle", label: "Bangles" },
  { key: "activewear", label: "Activewear" },
  { key: "co-ord", label: "Co-ords" },
];

export const OCCASIONS = [
  { key: "college", label: "College", icon: GraduationCap },
  { key: "work", label: "Work", icon: Briefcase },
  { key: "casual", label: "Casual", icon: Sun },
  { key: "date", label: "Date", icon: Heart },
  { key: "formal", label: "Formal", icon: Gem },
  { key: "travel", label: "Travel", icon: Plane },
  { key: "party", label: "Party", icon: PartyPopper },
  { key: "brunch", label: "Brunch", icon: Coffee },
];
