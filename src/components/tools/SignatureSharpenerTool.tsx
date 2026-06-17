"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, RefreshCcw, ImageDown } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import StatusBadge from "@/components/ui/StatusBadge";
import DownloadBtn from "@/components/ui/DownloadBtn";
import { loadImageWithOrientation } from "@/utils/exif";
import { sanitizeFilename } from "@/utils/filename";
import SizeComparison from "@/components/ui/SizeComparison";

type Status = "idle" | "processing" | "done" | "error";

interface SizePreset {
  label: string;
  sublabel: string;
  minKb: number;
  maxKb: number;
  color: string;
  ring: string;
  bg: string;
  dot: string;
  btnBg: string;
}

const PRESETS: SizePreset[] = [
  {
    label: "10–20 KB",
    sublabel: "SSC / IBPS",
    minKb: 10, maxKb: 20,
    color: "text-pink-700",
    ring: "ring-pink-400",
    bg: "bg-pink-50",
    dot: "bg-pink-400",
    btnBg: "bg-pink-600 hover:bg-pink-700 shadow-pink-200",
  },
  {
    label: "20–50 KB",
    sublabel: "UPSC / Others",
    minKb: 20, maxKb: 50,
    color: "text-rose-700",
    ring: "ring-rose-400",
    bg: "bg-rose-50",
    dot: "bg-rose-400",
    btnBg: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
  },
];

/**
 * Bradley-Roth adaptive thresholding.
 * Each pixel is compared to the mean brightness of its local neighbourhood
 * (radius px), minus a sensitivity offset. Handles uneven lighting and shadows.
 * Returns a binary Uint8Array: 1 = ink, 0 = background.
 */
function adaptiveThreshold(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius = 60,
  sensitivity = 0.18
): Uint8Array {
  // Build grayscale + integral image for O(1) local mean lookup
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 1; y <= height; y++) {
    for (let x = 1; x <= width; x++) {
      integral[y * (width + 1) + x] =
        gray[(y - 1) * width + (x - 1)] +
        integral[(y - 1) * (width + 1) + x] +
        integral[y * (width + 1) + (x - 1)] -
        integral[(y - 1) * (width + 1) + (x - 1)];
    }
  }
  const binary = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - radius), y1 = Math.max(0, y - radius);
      const x2 = Math.min(width - 1, x + radius), y2 = Math.min(height - 1, y + radius);
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        integral[(y2 + 1) * (width + 1) + (x2 + 1)] -
        integral[y1 * (width + 1) + (x2 + 1)] -
        integral[(y2 + 1) * (width + 1) + x1] +
        integral[y1 * (width + 1) + x1];
      const localMean = sum / count;
      binary[y * width + x] = gray[y * width + x] < localMean * (1 - sensitivity) ? 1 : 0;
    }
  }
  return binary;
}

export default function SignatureSharpenerTool() {
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [output, setOutput] = useState<{ url: string; sizeKb: number; filename: string; originalBytes: number; outputBytes: number } | null>(null);
  const fileRef = useRef<File | null>(null);

  function onFile(file: File) {
    fileRef.current = file;
    setPreview(URL.createObjectURL(file));
    setOutput(null);
    setStatus("idle");
    setMsg("");
  }

  async function compress() {
    if (!fileRef.current) return;
    const preset = PRESETS[selected];
    setStatus("processing");
    setMsg("Cleaning background…");
    setOutput(null);

    try {
      // Load with EXIF auto-rotation so mobile signature photos aren't sideways
      const { corrected: source } = await loadImageWithOrientation(fileRef.current);
      const canvas = document.createElement("canvas");
      canvas.width = source.width;
      canvas.height = source.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(source, 0, 0);

      // Adaptive local thresholding — handles uneven lighting and shadows
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const W = canvas.width, H = canvas.height;
      let binary = adaptiveThreshold(d, W, H);

      // Flood-fill from all 4 borders — removes dark objects/edges touching the frame
      const stack: number[] = [];
      for (let x = 0; x < W; x++) { stack.push(x); stack.push((H - 1) * W + x); }
      for (let y = 1; y < H - 1; y++) { stack.push(y * W); stack.push(y * W + W - 1); }
      while (stack.length) {
        const idx = stack.pop()!;
        if (idx < 0 || idx >= W * H || binary[idx] !== 1) continue;
        binary[idx] = 0;
        const x = idx % W, y = Math.floor(idx / W);
        if (x > 0) stack.push(idx - 1);
        if (x < W - 1) stack.push(idx + 1);
        if (y > 0) stack.push(idx - W);
        if (y < H - 1) stack.push(idx + W);
      }

      // Auto-crop: find tightest bounding box around ink pixels + padding
      let minX = W, maxX = 0, minY = H, maxY = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (binary[y * W + x] === 1) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      // Fall back to full image if no ink found
      if (minX >= maxX || minY >= maxY) { minX = 0; maxX = W - 1; minY = 0; maxY = H - 1; }
      const PAD = Math.round(Math.min(W, H) * 0.06);
      minX = Math.max(0, minX - PAD); maxX = Math.min(W - 1, maxX + PAD);
      minY = Math.max(0, minY - PAD); maxY = Math.min(H - 1, maxY + PAD);
      const cropW = maxX - minX + 1, cropH = maxY - minY + 1;

      // Draw cropped + binarized result onto final canvas
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx2 = canvas.getContext("2d")!;
      ctx2.fillStyle = "#ffffff";
      ctx2.fillRect(0, 0, cropW, cropH);
      const cropped = ctx2.createImageData(cropW, cropH);
      for (let y = 0; y < cropH; y++) {
        for (let x = 0; x < cropW; x++) {
          const srcIdx = (minY + y) * W + (minX + x);
          const dstIdx = (y * cropW + x) * 4;
          const val = binary[srcIdx] ? 0 : 255;
          cropped.data[dstIdx] = val;
          cropped.data[dstIdx + 1] = val;
          cropped.data[dstIdx + 2] = val;
          cropped.data[dstIdx + 3] = 255;
        }
      }
      ctx2.putImageData(cropped, 0, 0);

      setMsg(`Hitting ${preset.label}…`);

      // Binary-search JPEG quality to land in [minKb, maxKb]
      let lo = 0.01, hi = 1.0, bestBlob: Blob | null = null;
      for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        const blob = await canvasToBlob(canvas, mid);
        const kb = blob.size / 1024;
        if (kb >= preset.minKb && kb <= preset.maxKb) { bestBlob = blob; break; }
        if (kb > preset.maxKb) hi = mid;
        else { lo = mid; bestBlob = blob; }
      }
      if (!bestBlob) bestBlob = await canvasToBlob(canvas, (lo + hi) / 2);

      const kb = parseFloat((bestBlob.size / 1024).toFixed(1));
      const url = URL.createObjectURL(bestBlob);
      const filename = sanitizeFilename(fileRef.current.name);
      setOutput({ url, sizeKb: kb, filename, originalBytes: fileRef.current.size, outputBytes: bestBlob.size });
      setStatus("done");
      setMsg(`Done — ${kb} KB, pure white background`);
    } catch {
      setStatus("error");
      setMsg("Could not process image. Try another file.");
    }
  }

  function reset() {
    fileRef.current = null;
    setPreview(null);
    setOutput(null);
    setStatus("idle");
    setMsg("");
  }

  const preset = PRESETS[selected];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
          <PenLine className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Signature Sharpener</h2>
          <p className="text-sm text-slate-500">Pure white background, sharp ink — pick your size limit</p>
        </div>
      </div>

      {/* Size preset toggles */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Target File Size</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p, i) => (
            <motion.button
              key={p.label}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelected(i)}
              className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 px-3 py-3 text-center transition-all duration-200
                ${selected === i
                  ? `border-transparent ring-2 ${p.ring} ${p.bg} shadow-sm`
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                }`}
            >
              {selected === i && (
                <motion.span
                  layoutId="sig-preset-dot"
                  className={`absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${p.dot}`}
                />
              )}
              <span className={`text-sm font-bold ${selected === i ? p.color : "text-slate-700"}`}>{p.label}</span>
              <span className={`text-xs ${selected === i ? p.color + " opacity-70" : "text-slate-400"}`}>{p.sublabel}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Drop zone or preview */}
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DropZone onFile={onFile} accept="image/*" sublabel="JPG or PNG of your signature" />
          </motion.div>
        ) : (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Preview on checkered background to show transparency */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[repeating-conic-gradient(#e2e8f0_0%_25%,white_0%_50%)] bg-[size:20px_20px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={output?.url ?? preview}
                alt="Signature preview"
                className="mx-auto block max-h-40 w-full object-contain mix-blend-multiply"
              />
              {output && (
                <div className={`absolute bottom-2 right-2 rounded-full px-2.5 py-1 text-xs font-bold ${preset.bg} ${preset.color} ring-1 ${preset.ring}`}>
                  {output.sizeKb} KB
                </div>
              )}
            </div>

            <StatusBadge status={status} message={msg} />
            {output && <SizeComparison originalBytes={output.originalBytes} outputBytes={output.outputBytes} />}

            <div className="flex flex-wrap items-center gap-3">
              {!output && status !== "processing" && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={compress}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors ${preset.btnBg}`}
                >
                  <ImageDown className="h-4 w-4" />
                  Sharpen to {preset.label}
                </motion.button>
              )}

              {output && (
                <>
                  <DownloadBtn href={output.url} filename={output.filename} label="Download" size={`${output.sizeKb} KB`} />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setOutput(null); setStatus("idle"); setMsg(""); }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Try another size
                  </motion.button>
                </>
              )}

              <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-100 transition-colors">
                <RefreshCcw className="h-3.5 w-3.5" /> New image
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
}
