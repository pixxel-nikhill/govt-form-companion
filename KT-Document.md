# Govt Form Companion — Knowledge Transfer Document

---

## 1. Application Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| PDF Generation | jsPDF (lazy-loaded) |
| AI Background Removal | `@imgly/background-removal` (lazy-loaded) |
| Fonts | Geist & Geist Mono via `next/font/google` (self-hosted at build time) |

### Folder Structure

```
src/
├── app/
│   ├── layout.tsx          ← Root HTML shell, font setup, metadata
│   ├── page.tsx            ← Home page: hero, tool grid, footer
│   └── globals.css         ← Global Tailwind base styles
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx      ← Sticky top bar
│   │   └── ToolCard.tsx    ← Wrapper card for each tool
│   │
│   ├── tools/              ← One file per tool (all logic lives here)
│   │   ├── PassportPhotoTool.tsx
│   │   ├── SignatureSharpenerTool.tsx
│   │   ├── TextOverlayTool.tsx
│   │   ├── MarksheetPDFTool.tsx
│   │   └── BgRemoverTool.tsx
│   │
│   └── ui/                 ← Shared reusable UI primitives
│       ├── DropZone.tsx
│       ├── DownloadBtn.tsx
│       ├── StatusBadge.tsx
│       └── SizeComparison.tsx
│
└── utils/
    ├── exif.ts             ← EXIF orientation reading + canvas correction
    └── filename.ts         ← Safe filename sanitizer for downloads
```

### How it's structured

This is a **single-page application**. There is no routing — everything renders on `/`. Each tool is a fully self-contained React component. There is no global state manager (no Redux, no Zustand) — each tool manages its own state internally with `useState` and `useRef`. All file processing happens on the HTML5 Canvas API in the browser — no server, no API calls.

---

## 2. Component Map

### Layout Components

**`Header.tsx`**
Sticky top navigation bar. Shows the app logo on the left and the "100% Private — No Upload" trust badge on the right.

**`ToolCard.tsx`**
A wrapper card that every tool sits inside. Accepts an `accent` (Tailwind gradient string for the colored top stripe) and an `index` (used to stagger entrance animations).

**`page.tsx`**
The home page. Defines the hero section, privacy pills, 2-column tool grid, and footer. The `TOOL_ACCENTS` array at the top controls the color stripe for each card position.

---

### Tool Components

**`PassportPhotoTool.tsx` — Photo Compressor**
Compresses any photo to a precise KB range. User picks a size preset, drops a photo, gets a compressed JPEG. Uses EXIF correction + binary-search compression.

**`SignatureSharpenerTool.tsx` — Signature Sharpener**
Takes a photo of a handwritten signature and produces clean black ink on a pure white background. Uses adaptive thresholding + border flood-fill + auto-crop to ink bounding box. Has a Rotate 90° button for misaligned scans.

**`TextOverlayTool.tsx` — Name / Date Overlay**
Burns a name and date onto a photo with a semi-transparent label box. The overlay re-renders live on every config change via a `useEffect` watching the config state object.

**`MarksheetPDFTool.tsx` — Document PDF Compiler**
Accepts multiple images, lets the user reorder them by drag-and-drop, and compiles them into a single PDF. Uses binary search to find the JPEG quality that keeps the PDF under the chosen size cap. jsPDF is loaded lazily so it doesn't affect initial page load.

**`BgRemoverTool.tsx` — Background Remover**
Uses the `@imgly/background-removal` library (ISNet model) to AI-cut the background and replace it with white. The library is lazily imported on first use. After first download, the browser caches the model permanently. Has an amber notice explaining the one-time internet requirement.

---

### UI Primitives

**`DropZone.tsx`** — Drag-and-drop / click-to-upload file input. Supports single and multiple file modes.

**`DownloadBtn.tsx`** — Styled `<a download>` tag. Takes a blob URL, filename, label, and optional size badge.

**`StatusBadge.tsx`** — Shows processing / done / error state as a colored banner. Returns nothing when status is idle.

**`SizeComparison.tsx`** — Shows original → output size with a % reduction badge after successful compression.

---

## 3. Core Logic Breakdown

### A. EXIF Orientation Correction — `src/utils/exif.ts`

**The problem:** Phone photos are often stored rotated in the file, with an EXIF tag telling apps to rotate when displaying. Browsers respect this for `<img>` tags but NOT for `canvas.drawImage()`, so without correction the canvas output is sideways.

**How it works:**
1. `readExifOrientation(buffer)` — Parses raw JPEG bytes, walks JPEG markers to find the APP1 EXIF segment, reads the TIFF IFD0, returns orientation value 1–8.
2. `drawWithOrientation(img, orientation)` — Applies a 2D transform matrix to the canvas matching the EXIF orientation before drawing. Orientations 5–8 also swap canvas width/height.
3. `loadImageWithOrientation(file)` — The public function all tools call. Returns a `corrected` canvas ready for further processing.

**Every tool that processes images calls this first.**

---

### B. Binary-Search JPEG Compression Loop

Used in: `PassportPhotoTool`, `SignatureSharpenerTool`, `BgRemoverTool`, `MarksheetPDFTool`

**The problem:** You can't directly tell JPEG "output at exactly 35 KB." Quality (0–1) and file size have a non-linear, image-dependent relationship.

**The solution:**
```
lo = 0.01, hi = 1.0

repeat up to 18 times:
  mid = (lo + hi) / 2
  encode canvas as JPEG at quality = mid
  measure output KB

  if KB is within [minKb, maxKb] → done ✓
  if KB > maxKb → too big  → hi = mid
  if KB < minKb → too small → lo = mid
```
Converges in ~10–14 iterations for most images. For the PDF tool, the entire PDF is built at each iteration and its total byte size is measured.

---

### C. Adaptive Thresholding — `SignatureSharpenerTool.tsx`

**The problem:** Signature photos have uneven lighting — yellowish paper, shadows, smudges. A simple global brightness threshold fails on these.

**How it works (`adaptiveThreshold()` function):**
1. Convert each pixel to grayscale using: `0.299R + 0.587G + 0.114B`
2. Build an integral image (summed-area table) for O(1) rectangle sum lookups
3. For each pixel, compute the local mean brightness in a 60px radius neighborhood
4. A pixel is **ink** if its brightness is more than 18% below the local mean

This means ink is detected relative to surrounding brightness, not a fixed global value — so it works even in shadowed corners.

**Border flood-fill:** A stack-based flood-fill from all 4 edges removes ink pixels connected to the border (background noise, not real ink).

**Auto-crop:** Finds the tightest bounding box around remaining ink pixels (ignoring rows/columns with fewer than 4 ink pixels), pads it by 20px, and crops the canvas.

---

### D. AI Background Removal — `BgRemoverTool.tsx`

1. File is EXIF-corrected to a canvas
2. Canvas is converted to a PNG Blob (required by the library)
3. `removeBackground(blob, { model: "isnet" })` runs a neural network locally via WebAssembly. First use downloads model weights (~80MB) from `staticimgly.com` and caches them in the browser permanently.
4. Output is a transparent PNG
5. Transparent PNG is composited onto a white canvas (`fillRect` white first, then `drawImage` on top)
6. Result goes through the binary-search compression loop to hit target KB

---

## 4. State Management

There is no global state. Each tool is fully isolated. Flow within a typical tool:

```
User drops file
  → fileRef.current = file     (useRef — no re-render triggered)
  → setPreview(blobURL)        (useState — triggers image preview render)

User clicks Compress
  → setStatus("processing")   → StatusBadge shows spinner
  → setMsg("...")              → message updates live
  → canvas processing runs...
  → setOutput({ url, sizeKb, originalBytes, outputBytes })
  → setStatus("done")         → StatusBadge turns green

User clicks Download
  → Native <a download> handles it — no state involved

User clicks Reset
  → All state cleared back to initial values
```

**Why `useRef` for the file?** The File object doesn't need to trigger re-renders — it's only read when the user clicks compress.

**TextOverlayTool is the exception:** It uses a `config` state object and a `useEffect` that watches it. Every config change (name, date, position, font size, colors) triggers `renderOverlay()` and the preview updates live.

---

## 5. Customization Guide

### Change hero text, pills, or footer
**File:** `src/app/page.tsx`

| What | Where |
|---|---|
| Hero heading | `<h1>` tag (~line 45) |
| Hero description | `<p>` tag below h1 (~line 51) |
| Privacy pills text/colors | `PILLS` array at top of file |
| Footer name, email, LinkedIn | Footer section at the bottom |

---

### Change tool card accent colors
**File:** `src/app/page.tsx` — `TOOL_ACCENTS` array at the top

```js
const TOOL_ACCENTS = [
  "bg-gradient-to-r from-violet-500 to-indigo-500",  // PassportPhoto
  "bg-gradient-to-r from-pink-500 to-rose-500",       // Signature
  "bg-gradient-to-r from-amber-400 to-orange-500",    // TextOverlay
  "bg-gradient-to-r from-teal-400 to-cyan-500",       // MarksheetPDF
  "bg-gradient-to-r from-purple-500 to-fuchsia-500",  // BgRemover
];
```

---

### Change compression KB targets
Each tool has a `PRESETS` array at the top. Edit `minKb` / `maxKb`:

| Tool | File |
|---|---|
| Photo Compressor | `src/components/tools/PassportPhotoTool.tsx` |
| Signature Sharpener | `src/components/tools/SignatureSharpenerTool.tsx` |
| Background Remover | `src/components/tools/BgRemoverTool.tsx` |
| PDF Compiler | `src/components/tools/MarksheetPDFTool.tsx` (uses `maxKb` only) |

---

### Change tool names / descriptions
Each tool file has a header block in its `return()`:
```tsx
<h2 className="font-bold text-slate-800">Photo Compressor</h2>
<p className="text-sm text-slate-500">Pick a size target, drop your photo, compress</p>
```

---

### Change app name / browser tab title
**File:** `src/app/layout.tsx`
```ts
export const metadata: Metadata = {
  title: "Govt Form Companion",
  description: "...",
};
```

---

### Change signature sharpening sensitivity
**File:** `src/components/tools/SignatureSharpenerTool.tsx` — `adaptiveThreshold()` function

- `radius = 60` — neighborhood size for local brightness. Larger handles bigger lighting changes but is slower.
- `sensitivity = 0.18` — how much darker than local average counts as ink. Higher picks up lighter ink but also more noise.

---

### Add a new tool
1. Create `src/components/tools/YourTool.tsx` following the same pattern as any existing tool
2. Import it in `src/app/page.tsx`
3. Add a new gradient to `TOOL_ACCENTS`
4. Wrap it in `<ToolCard accent={...} index={...}>` inside the grid
