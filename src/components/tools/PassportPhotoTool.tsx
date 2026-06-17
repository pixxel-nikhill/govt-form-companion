"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, RefreshCcw, ImageDown } from "lucide-react";
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
  px: number;
  color: string;
  ring: string;
  bg: string;
  dot: string;
}

const PRESETS: SizePreset[] = [
  { label: "10–20 KB",  sublabel: "Signatures",      minKb: 10,  maxKb: 20,  px: 200,  color: "text-violet-700", ring: "ring-violet-400", bg: "bg-violet-50", dot: "bg-violet-400" },
  { label: "20–50 KB",  sublabel: "Standard Photos",  minKb: 20,  maxKb: 50,  px: 350,  color: "text-indigo-700", ring: "ring-indigo-400", bg: "bg-indigo-50", dot: "bg-indigo-400" },
  { label: "50–100 KB", sublabel: "Better Quality",   minKb: 50,  maxKb: 100, px: 600,  color: "text-sky-700",    ring: "ring-sky-400",    bg: "bg-sky-50",    dot: "bg-sky-400" },
  { label: "100–200 KB",sublabel: "High Quality",     minKb: 100, maxKb: 200, px: 1000, color: "text-teal-700",   ring: "ring-teal-400",   bg: "bg-teal-50",   dot: "bg-teal-400" },
];

const BTN_COLOR = [
  "bg-violet-600 hover:bg-violet-700 shadow-violet-200",
  "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
  "bg-sky-600 hover:bg-sky-700 shadow-sky-200",
  "bg-teal-600 hover:bg-teal-700 shadow-teal-200",
];

export default function PassportPhotoTool() {
  const [selectedPreset, setSelectedPreset] = useState<number>(1);
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
    const preset = PRESETS[selectedPreset];
    setStatus("processing");
    setMsg(`Correcting orientation…`);
    setOutput(null);

    try {
      // Load with EXIF auto-rotation correction
      const { corrected: source } = await loadImageWithOrientation(fileRef.current);

      setMsg(`Resizing to ${preset.px}×${preset.px} px…`);
      const canvas = document.createElement("canvas");
      canvas.width = preset.px;
      canvas.height = preset.px;
      const ctx = canvas.getContext("2d")!;

      // Centre-crop square from orientation-corrected source
      const side = Math.min(source.width, source.height);
      const sx = (source.width - side) / 2;
      const sy = (source.height - side) / 2;
      ctx.drawImage(source, sx, sy, side, side, 0, 0, preset.px, preset.px);

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
      setMsg(`Done — ${kb} KB at ${preset.px}×${preset.px} px`);
    } catch {
      setStatus("error");
      setMsg("Something went wrong. Try a different image.");
    }
  }

  function reset() {
    fileRef.current = null;
    setPreview(null);
    setOutput(null);
    setStatus("idle");
    setMsg("");
  }

  const preset = PRESETS[selectedPreset];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
          <User className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Photo Compressor</h2>
          <p className="text-sm text-slate-500">Pick a size target, drop your photo, compress</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Target File Size</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS.map((p, i) => (
            <motion.button
              key={p.label}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedPreset(i)}
              className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 px-3 py-3 text-center transition-all duration-200
                ${selectedPreset === i
                  ? `border-transparent ring-2 ${p.ring} ${p.bg} shadow-sm`
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"}`}
            >
              {selectedPreset === i && (
                <motion.span layoutId="preset-dot" className={`absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${p.dot}`} />
              )}
              <span className={`text-sm font-bold ${selectedPreset === i ? p.color : "text-slate-700"}`}>{p.label}</span>
              <span className={`text-xs ${selectedPreset === i ? p.color + " opacity-70" : "text-slate-400"}`}>{p.sublabel}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DropZone onFile={onFile} accept="image/*" sublabel="JPG, PNG, WEBP — mobile photos auto-rotated" />
          </motion.div>
        ) : (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={output?.url ?? preview} alt="Preview" className="mx-auto block max-h-56 w-full object-contain" />
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
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={compress}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors ${BTN_COLOR[selectedPreset]}`}
                >
                  <ImageDown className="h-4 w-4" />
                  Compress to {preset.label}
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
                <RefreshCcw className="h-3.5 w-3.5" /> New photo
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
