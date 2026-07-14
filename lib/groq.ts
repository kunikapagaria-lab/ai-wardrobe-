import Groq from "groq-sdk";
import type { ClothingTags, OutfitPhotoAnalysis } from "@/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "llama-3.3-70b-versatile";

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mime: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const mime = res.headers.get("content-type") ?? "image/jpeg";
  const base64 = Buffer.from(buffer).toString("base64");
  return { base64, mime };
}

export async function analyzeClothing(photoUrl: string): Promise<ClothingTags> {
  const { base64, mime } = await fetchImageAsBase64(photoUrl);

  const prompt = `Analyze this clothing item photo. Return ONLY valid JSON with this exact structure:
{
  "category": one of: top|bottom|dress|outerwear|shoes|bag|accessory|activewear|co-ord|jumpsuit|traditional|necklace|ring|bracelet|bangle|other,
  "colors": ["color1", "color2"],
  "style": array of: casual|smart-casual|formal|business|streetwear|athleisure|bohemian|minimalist|vintage|ethnic|party,
  "occasion": array of: work|casual|date|formal|party|beach|gym|travel|brunch|college,
  "season": array of: spring|summer|autumn|winter|all-season,
  "pattern": "solid" or pattern name,
  "material": fabric type or "unknown",
  "fit": "regular" or fit description,
  "confidence": 0.0-1.0
}`;

  const response = await groq.chat.completions.create({
    model: VISION_MODEL,
    messages: [{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
        { type: "text", text: prompt },
      ],
    }],
    temperature: 0.1,
    max_tokens: 500,
  });

  const text = response.choices[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Invalid AI response");

  const tags = JSON.parse(match[0]) as ClothingTags;
  if (!tags.colors) tags.colors = ["unknown"];
  if (!tags.style) tags.style = ["casual"];
  if (!tags.occasion) tags.occasion = ["casual"];
  if (!tags.season) tags.season = ["all-season"];
  if (!tags.confidence) tags.confidence = 0.8;
  return tags;
}

export async function analyzeOutfitPhoto(photoUrl: string): Promise<OutfitPhotoAnalysis> {
  const { base64, mime } = await fetchImageAsBase64(photoUrl);

  const prompt = `Analyze this full outfit photo. Return ONLY valid JSON:
{
  "overall_style": ["style1"],
  "occasion": ["occasion1"],
  "season": ["season1"],
  "pieces": [{"category": "top", "colors": ["white"], "description": "white linen shirt"}],
  "caption_suggestion": "one line caption",
  "confidence": 0.9
}`;

  const response = await groq.chat.completions.create({
    model: VISION_MODEL,
    messages: [{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
        { type: "text", text: prompt },
      ],
    }],
    temperature: 0.1,
    max_tokens: 800,
  });

  const text = response.choices[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Invalid AI response");
  return JSON.parse(match[0]) as OutfitPhotoAnalysis;
}

interface WardrobeItem {
  id: string;
  name?: string;
  photo_url: string;
  thumbnail_url?: string | null;
  tags: ClothingTags;
}

interface OutfitCombo {
  item_ids: string[];
  reasoning: string;
  style_notes: string;
}

export async function generateOutfitRecommendations(
  wardrobe: WardrobeItem[],
  occasion: string,
  count: number
): Promise<OutfitCombo[]> {
  const summary = wardrobe.map((i) => ({
    id: i.id,
    category: i.tags.category,
    colors: i.tags.colors,
    style: i.tags.style,
  }));

  const prompt = `You are a personal stylist. Create ${count} outfit combinations for a ${occasion} occasion from this wardrobe:
${JSON.stringify(summary, null, 2)}

Rules:
- Each outfit needs at least a top/dress and bottom/shoes
- Use only the provided item IDs
- No duplicate items across outfits
- Return ONLY a JSON array: [{"item_ids": ["id1","id2","id3"], "reasoning": "why this works", "style_notes": "styling tip"}]`;

  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const text = response.choices[0]?.message?.content ?? "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  return JSON.parse(match[0]) as OutfitCombo[];
}

interface MixMatchCombo {
  item_ids: string[];
  headline: string;
  reasoning: string;
  is_new_pairing: boolean;
}

export async function generateMixMatch(
  wardrobe: WardrobeItem[],
  count: number
): Promise<MixMatchCombo[]> {
  const summary = wardrobe.map((i) => ({
    id: i.id,
    category: i.tags.category,
    colors: i.tags.colors,
    style: i.tags.style,
  }));

  const prompt = `You are a creative stylist. Find ${count} unexpected but stylish item combinations from this wardrobe:
${JSON.stringify(summary, null, 2)}

Return ONLY a JSON array: [{"item_ids": ["id1","id2"], "headline": "short catchy name", "reasoning": "why it works", "is_new_pairing": true}]`;

  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
    max_tokens: 1500,
  });

  const text = response.choices[0]?.message?.content ?? "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  return JSON.parse(match[0]) as MixMatchCombo[];
}

interface ShoppingCombo {
  item_name: string;
  category: string;
  colors: string[];
  style: string[];
  reasoning: string;
  pairs_with_item_ids: string[];
}

export async function generateShoppingRecommendations(
  wardrobe: WardrobeItem[],
  gaps: string[],
  count: number,
  stylePreference?: string
): Promise<ShoppingCombo[]> {
  const summary = wardrobe.map((i) => ({
    id: i.id,
    name: i.name || i.tags.category,
    category: i.tags.category,
    colors: i.tags.colors,
    style: i.tags.style,
  }));

  const styleFreq: Record<string, number> = {};
  wardrobe.forEach((i) => i.tags.style.forEach((s) => { styleFreq[s] = (styleFreq[s] ?? 0) + 1; }));
  const dominantStyles = Object.entries(styleFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s);
  const dominantStyleText = dominantStyles.length ? dominantStyles.join(", ") : "not enough data yet — infer from their pieces";
  const preference = stylePreference?.trim();

  // A stated preference is the client explicitly telling us what to shop for —
  // it must win over "match the existing wardrobe" whenever the two conflict
  // (e.g. they're deliberately shopping for a new direction, like sportswear
  // for an otherwise ethnic/bohemian closet). Only fall back to matching the
  // wardrobe's established style when no preference was given.
  const styleDirective = preference
    ? `The client has explicitly told you what they're shopping for: "${preference}". This OVERRIDES everything else about aesthetic — every single suggestion must be a "${preference}" item first and foremost, even if it looks different from their current wardrobe. Do not soften this into their existing style.`
    : `Match their wardrobe's established style (${dominantStyleText}) — don't suggest a jarringly different aesthetic (e.g. don't suggest a bohemian piece for an otherwise minimalist/business wardrobe) unless it's a deliberate, tasteful expansion that still reads as "them".`;

  const prompt = `You are an expert personal stylist curating a shopping list for a real client. Study their wardrobe below and suggest ${count} SPECIFIC items to buy — not generic filler.

${styleDirective}

Wardrobe:
${JSON.stringify(summary, null, 2)}

Wardrobe's current style (for pairing context only${preference ? ", secondary to the client's stated request above" : ""}): ${dominantStyleText}

Identified gaps:
${gaps.length ? gaps.join("\n") : "None — wardrobe is well-balanced."}

Rules:
- ${preference ? `Every suggestion MUST be a genuine "${preference}" item — that comes first, before wardrobe-matching` : "Every suggestion MUST feel like it belongs in this wardrobe's established style"}
- Be concrete: name an exact garment type, cut/silhouette, and color — e.g. "rust corduroy A-line skirt" or "structured black leather crossbody bag", never a vague "top" or "dress"
- Give each suggestion a DIFFERENT role — vary between: a practical layering piece, something for an occasion they're missing, a texture/print variation, or a genuine color-gap fill
- Do NOT default every suggestion to "neutral" or "versatile" — but never force color/pattern variety at the cost of matching ${preference ? "the stated request" : "their taste"}
- Still try to reference existing wardrobe items/colors by name in "reasoning" (1-2 sentences) where it's genuinely relevant — but never force a pairing that contradicts the style requirement above, and never use generic phrases like "existing bottoms" or "balance the warm palette". NEVER include an item's id/uuid in the reasoning text — refer to items only by name, e.g. "the yellow linen shirt", not "the yellow linen shirt (60358164-...)"
- Suggest real, purchasable item types (not brand names) — categories include clothing (top/bottom/dress/outerwear/shoes) as well as accessories (bag/necklace/ring/bracelet/bangle); include a jewelry or bag suggestion when it's a genuine gap, not just clothing every time
- Each suggestion must reference 2-4 existing item IDs from the wardrobe it would pair well with (if truly nothing pairs well, reference the closest 1-2 anyway)
- Return ONLY a JSON array: [{"item_name": "rust corduroy A-line skirt", "category": "bottom", "colors": ["rust"], "style": ["vintage"], "reasoning": "why this complements their specific wardrobe", "pairs_with_item_ids": ["id1","id2"]}]`;

  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.85,
    max_tokens: 1500,
  });

  const text = response.choices[0]?.message?.content ?? "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  return JSON.parse(match[0]) as ShoppingCombo[];
}
