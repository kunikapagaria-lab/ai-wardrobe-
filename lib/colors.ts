export type ColorFamily = "neutral" | "warm" | "cool" | "bright" | "pastel";

export const FAMILY_LABELS: Record<ColorFamily, string> = {
  neutral: "Neutrals",
  warm: "Warm",
  cool: "Cool",
  bright: "Bright & Jewel",
  pastel: "Pastel",
};

export const FAMILY_SWATCH: Record<ColorFamily, string> = {
  neutral: "#A8A29E",
  warm: "#C1633B",
  cool: "#3C6E9C",
  bright: "#D63B8C",
  pastel: "#C7B8E0",
};

interface ColorEntry {
  match: string[];
  hex: string;
  family: ColorFamily;
  label: string;
}

const COLOR_DB: ColorEntry[] = [
  // Neutrals
  { match: ["black"], hex: "#1C1C1C", family: "neutral", label: "Black" },
  { match: ["white", "off-white", "off white"], hex: "#F5F4F0", family: "neutral", label: "White" },
  { match: ["ivory"], hex: "#F3EEDD", family: "neutral", label: "Ivory" },
  { match: ["cream"], hex: "#F0E6CE", family: "neutral", label: "Cream" },
  { match: ["beige"], hex: "#E3D5B8", family: "neutral", label: "Beige" },
  { match: ["tan"], hex: "#D2B48C", family: "neutral", label: "Tan" },
  { match: ["khaki"], hex: "#C3B091", family: "neutral", label: "Khaki" },
  { match: ["camel"], hex: "#C19A6B", family: "neutral", label: "Camel" },
  { match: ["taupe"], hex: "#B8A99A", family: "neutral", label: "Taupe" },
  { match: ["stone"], hex: "#B7AFA3", family: "neutral", label: "Stone" },
  { match: ["gray", "grey"], hex: "#9B9B93", family: "neutral", label: "Gray" },
  { match: ["charcoal"], hex: "#3B3B3B", family: "neutral", label: "Charcoal" },
  { match: ["silver"], hex: "#C4C4C4", family: "neutral", label: "Silver" },
  { match: ["navy"], hex: "#1B2A4A", family: "neutral", label: "Navy" },
  { match: ["denim"], hex: "#4A6D8C", family: "neutral", label: "Denim" },
  { match: ["brown"], hex: "#6B4226", family: "neutral", label: "Brown" },
  { match: ["chocolate"], hex: "#4A2E1E", family: "neutral", label: "Chocolate" },
  { match: ["cognac"], hex: "#9A4B2E", family: "neutral", label: "Cognac" },

  // Warm
  { match: ["red"], hex: "#C0392B", family: "warm", label: "Red" },
  { match: ["maroon"], hex: "#6E2434", family: "warm", label: "Maroon" },
  { match: ["burgundy", "wine"], hex: "#5C1F2E", family: "warm", label: "Burgundy" },
  { match: ["rust"], hex: "#B5542A", family: "warm", label: "Rust" },
  { match: ["terracotta", "brick"], hex: "#C1633B", family: "warm", label: "Terracotta" },
  { match: ["orange"], hex: "#D9782D", family: "warm", label: "Orange" },
  { match: ["coral"], hex: "#E8785B", family: "warm", label: "Coral" },
  { match: ["salmon"], hex: "#E89B8C", family: "warm", label: "Salmon" },
  { match: ["mustard"], hex: "#C99A2E", family: "warm", label: "Mustard" },
  { match: ["gold"], hex: "#C6A15B", family: "warm", label: "Gold" },
  { match: ["yellow"], hex: "#E2C14C", family: "warm", label: "Yellow" },
  { match: ["peach"], hex: "#EFC1A3", family: "warm", label: "Peach" },

  // Cool
  { match: ["sky blue", "baby blue", "powder blue"], hex: "#9FC4DC", family: "pastel", label: "Sky Blue" },
  { match: ["blue"], hex: "#3C6E9C", family: "cool", label: "Blue" },
  { match: ["teal"], hex: "#2C7A7A", family: "cool", label: "Teal" },
  { match: ["turquoise", "aqua"], hex: "#3FAFA0", family: "cool", label: "Turquoise" },
  { match: ["cobalt", "indigo"], hex: "#2E4A9C", family: "cool", label: "Indigo" },
  { match: ["mint"], hex: "#B7DCC7", family: "pastel", label: "Mint" },
  { match: ["olive"], hex: "#6B6E3C", family: "cool", label: "Olive" },
  { match: ["sage"], hex: "#8A9A7B", family: "cool", label: "Sage" },
  { match: ["emerald"], hex: "#1F7A5C", family: "cool", label: "Emerald" },
  { match: ["forest green"], hex: "#2C4A2E", family: "cool", label: "Forest Green" },
  { match: ["green"], hex: "#4C7A4C", family: "cool", label: "Green" },

  // Pink / purple
  { match: ["hot pink", "fuchsia", "magenta"], hex: "#D63B8C", family: "bright", label: "Fuchsia" },
  { match: ["blush"], hex: "#EAC7C4", family: "pastel", label: "Blush" },
  { match: ["pink"], hex: "#DE8FA3", family: "bright", label: "Pink" },
  { match: ["lavender", "lilac"], hex: "#C7B8E0", family: "pastel", label: "Lavender" },
  { match: ["violet"], hex: "#8A5CB5", family: "bright", label: "Violet" },
  { match: ["plum"], hex: "#6E3A5C", family: "bright", label: "Plum" },
  { match: ["purple"], hex: "#7A4C9C", family: "bright", label: "Purple" },

  // Pastels
  { match: ["pale yellow", "butter"], hex: "#EFE3A3", family: "pastel", label: "Pale Yellow" },
  { match: ["pale green"], hex: "#C7DCB7", family: "pastel", label: "Pale Green" },
];

export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function resolveColor(rawName: string): ColorEntry {
  const normalized = rawName.trim().toLowerCase();
  if (!normalized) return { match: [], hex: "#C4C0B6", family: "neutral", label: "Unknown" };

  const exact = COLOR_DB.find((entry) => entry.match.includes(normalized));
  if (exact) return exact;

  let best: { entry: ColorEntry; len: number } | null = null;
  for (const entry of COLOR_DB) {
    for (const kw of entry.match) {
      if (normalized.includes(kw) && (!best || kw.length > best.len)) {
        best = { entry, len: kw.length };
      }
    }
  }
  if (best) return best.entry;

  return { match: [], hex: "#C4C0B6", family: "neutral", label: titleCase(rawName) };
}
