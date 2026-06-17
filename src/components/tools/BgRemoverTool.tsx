"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eraser, RefreshCcw, ImageDown } from "lucide-react";
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
    label: "20-50 KB",
    sublabel: "SSC / IBPS",
    minKb: 20, maxKb: 50,
    color: "text-purple-700",
    ring: "ring-purple-400",
    bg: "bg-purple-50",
    dot: "bg-purple-400",
    btnBg: "bg-purple-600 hover:bg-purple-700 shadow-purple-200",
  },
  {
    label: "50-100 KB",
    sublabel: "UPSC / Others",
    minKb: 50, maxKb: 100,
    color: "text-fuchsia-700",
    ring: "ring-fuchsia-400",
    bg: "bg-fuchsia-50",
    dot: "bg-fuchsia-400",
    btnBg: "bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-200",
  },
  {
    label: "100-200 KB",
    sublabel: "High Quality",
    minKb: 100, maxKb: 200,
    color: "text-violet-700",
    ring: "ring-violet-400",
    bg: "bg-violet-50",
    dot: "bg-violet-400",
    btnBg: "bg-violet-600 hover:bg-violet-700 shadow-violet-200",
  },
];

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
}

export default function BgRemoverTool() {
  const [selected, setSelected] = useState(1);
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

  async function process() {
    if (!fileRef.current) return;
    const preset = PRESETS[selected];
    setStatus("processing");
    setOutput(null);

    try {
      setMsg("Loading AI model (first use may take ~10s)...");
      const { removeBackground } = await import("@imgly/background-removal");

      setMsg("Removing background...");
      const { corrected: source } = await loadImageWithOrientation(fileRef.current);

      // Convert the EXIF-corrected canvas to a Blob for the library
      const srcBlob: Blob = await new Promise((res) =>
        source.toBlob((b) => res(b!), "image/png")
      );

      // AI background removal — returns a PNG Blob with transparent background
      const removedBlob = await removeBackground(srcBlob);

      setMsg("Compositing white background...");

      // Draw the transparent PNG onto a white canvas
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const el = new Image();
        el.onload = () => res(el);
        el.onerror = rej;
        el.src = URL.createObjectURL(removedBlob);
      });

      // Scale to max 1200px longest side to keep output size manageable
      const MAX_SIDE = 1200;
      const longestSide = Math.max(img.width, img.height);
      const scale = longestSide > MAX_SIDE ? MAX_SIDE / longestSide : 1;
      const outW = Math.round(img.width * scale);
      const outH = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);
      ctx.drawImage(img, 0, 0, outW, outH);

      setMsg("Hitting " + preset.label + "...");

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
      setMsg("Done - " + kb + " KB, white background");
    } catch {
      setStatus("error");
      setMsg("Could not process image. Try a clearer photo.");
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
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <Eraser className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Background Remover</h2>
          <p className="text-sm text-slate-500">AI removes background, replaces with white - fully private</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Target File Size</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p, i) => (
            <motion.button
              key={p.label}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelected(i)}
              className={"relative flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition-all duration-200 " +
                (selected === i
                  ? "border-transparent ring-2 " + p.ring + " " + p.bg + " shadow-sm"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50")}
            >
              {selected === i && (
                <motion.span
                  layoutId="bg-preset-dot"
                  className={"absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full border-2 border-white " + p.dot}
                />
              )}
              <span className={"text-xs font-bold leading-tight " + (selected === i ? p.color : "text-slate-700")}>{p.label}</span>
              <span className={"text-xs " + (selected === i ? p.color + " opacity-70" : "text-slate-400")}>{p.sublabel}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DropZone onFile={onFile} accept="image/*" sublabel="JPG or PNG with any background" />
          </motion.div>
        ) : (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={output?.url ?? preview}
                alt="Preview"
                className="mx-auto block max-h-52 w-full object-contain"
              />
              {output && (
                <div className={"absolute bottom-2 right-2 rounded-full px-2.5 py-1 text-xs font-bold " + preset.bg + " " + preset.color + " ring-1 " + preset.ring}>
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
                  onClick={process}
                  className={"inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors " + preset.btnBg}
                >
                  <ImageDown className="h-4 w-4" />
                  Remove Background
                </motion.button>
              )}

              {output && (
                <>
                  <DownloadBtn href={output.url} filename={output.filename} label="Download" size={output.sizeKb + " KB"} />
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
