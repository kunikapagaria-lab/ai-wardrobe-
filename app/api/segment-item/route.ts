import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import Groq from "groq-sdk";
import { requireUser } from "@/lib/require-auth";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

interface BoundingBox {
  x: number;   // left edge, % of image width
  y: number;   // top edge, % of image height
  width: number;
  height: number;
}

async function getItemBoundingBox(
  imageBase64: string,
  mime: string,
  category: string,
  description: string
): Promise<BoundingBox> {
  // Category-specific instructions to avoid face and crop correctly
  const cropGuide: Record<string, string> = {
    top:        "Capture shoulders to just below the waist. NEVER include the face or head.",
    bottom:     "Capture from the waist/hips down to the feet. Do not include the torso or face.",
    dress:      "Capture from the shoulders down to the hem. NEVER include the face or head.",
    outerwear:  "Capture from shoulders down to the hem. NEVER include the face.",
    shoes:      "Capture only the feet and shoes area, from the ankles down.",
    bag:        "Capture only the bag itself, not the person holding it.",
    accessory:  "Capture only the accessory (belt, scarf, jewellery, hat, glasses) itself.",
    activewear: "Capture from shoulders to feet. NEVER include the face.",
    "co-ord":   "Capture the full co-ord set from shoulders to hem. NEVER include the face.",
    jumpsuit:   "Capture from shoulders down to the hem. NEVER include the face.",
    traditional:"Capture the full traditional outfit from shoulders down. NEVER include the face.",
  };

  const guide = cropGuide[category] ?? "Capture only the clothing item. Do not include the face.";

  const prompt = `You are a precise image-cropping assistant.

Look at this outfit photo and identify the bounding box of this specific item:
Category: ${category}
Description: ${description}

Cropping rule: ${guide}

Return ONLY this JSON (no extra text):
{
  "x": <left edge as integer % of image width, 0-100>,
  "y": <top edge as integer % of image height, 0-100>,
  "width": <crop width as integer % of image width, 1-100>,
  "height": <crop height as integer % of image height, 1-100>
}

Be precise. Add ~5% padding around the item. Ensure the bounding box stays within 0-100 range.`;

  const response = await groq.chat.completions.create({
    model: VISION_MODEL,
    messages: [{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${mime};base64,${imageBase64}` } },
        { type: "text", text: prompt },
      ],
    }],
    temperature: 0.1,
    max_tokens: 100,
  });

  const text = response.choices[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*?\}/);
  if (!match) throw new Error("Could not detect item bounding box");

  const box = JSON.parse(match[0]) as BoundingBox;

  // Clamp all values to valid range
  box.x = Math.max(0, Math.min(95, box.x));
  box.y = Math.max(0, Math.min(95, box.y));
  box.width = Math.max(5, Math.min(100 - box.x, box.width));
  box.height = Math.max(5, Math.min(100 - box.y, box.height));
  return box;
}

async function cropAndRemoveBg(
  imageBuffer: Buffer,
  box: BoundingBox
): Promise<string> {
  // Get image dimensions
  const meta = await sharp(imageBuffer).metadata();
  const imgW = meta.width ?? 800;
  const imgH = meta.height ?? 1000;

  // Convert percentages to pixels
  const left = Math.round((box.x / 100) * imgW);
  const top = Math.round((box.y / 100) * imgH);
  const width = Math.round((box.width / 100) * imgW);
  const height = Math.round((box.height / 100) * imgH);

  // Crop the image
  const cropped = await sharp(imageBuffer)
    .extract({ left, top, width, height })
    .jpeg({ quality: 90 })
    .toBuffer();

  const croppedBase64 = cropped.toString("base64");

  // Run remove.bg on the cropped image
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    // If no API key, just return the cropped image as-is
    return croppedBase64;
  }

  const params = new URLSearchParams({
    image_file_b64: croppedBase64,
    size: "auto",
    bg_color: "ffffff",
  });

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    // remove.bg failed — return cropped-only result
    return croppedBase64;
  }

  const resultBuffer = await res.arrayBuffer();
  return Buffer.from(resultBuffer).toString("base64");
}

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  try {
    const { photoUrl, category, description } = await req.json();
    if (!photoUrl || !category) {
      return NextResponse.json({ error: "photoUrl and category required" }, { status: 400 });
    }

    // Fetch the original image
    const imgRes = await fetch(photoUrl);
    if (!imgRes.ok) throw new Error("Could not fetch image");
    const arrayBuffer = await imgRes.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const mime = imgRes.headers.get("content-type") ?? "image/jpeg";
    const imageBase64 = imageBuffer.toString("base64");

    // Get bounding box from AI
    const box = await getItemBoundingBox(imageBase64, mime, category, description ?? category);

    // Crop + remove background
    const resultBase64 = await cropAndRemoveBg(imageBuffer, box);

    return NextResponse.json({ base64: resultBase64 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Segmentation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
