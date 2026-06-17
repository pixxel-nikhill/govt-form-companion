"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Type, RefreshCcw } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import StatusBadge from "@/components/ui/StatusBadge";
import DownloadBtn from "@/components/ui/DownloadBtn";

type Status = "idle" | "processing" | "done" | "error";

interface OverlayConfig {
  name: string;
  date: string;
  position: "bottom-left" | "bottom-center" | "bottom-right" | "top-left" | "top-right";
  fontSize: number;
  fontColor: string;
  bgColor: string;
  bgOpacity: number;
}

export default function TextOverlayTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [output, setOutput] = useState<{ url: string; sizeKb: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [config, setConfig] = useState<OverlayConfig>({
    name: "",
    date: "",
    position: "bottom-left",
    fontSize: 28,
    fontColor: "#ffffff",
    bgColor: "#000000",
    bgOpacity: 0.55,
  });

  useEffect(() => {
    if (imgRef.current) renderOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  async function process(file: File) {
    setStatus("processing");
    setMsg("Loading image…");
    try {
      const img = await loadImage(file);
      imgRef.current = img;
      await renderOverlay(img);
    } catch {
      setStatus("error");
      setMsg("Failed to load image.");
    }
  }

  async function renderOverlay(img?: HTMLImageElement) {
    const source = img ?? imgRef.current;
    if (!source) return;
    setStatus("processing");
    setMsg("Rendering text overlay…");

    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(source, 0, 0);

    const lines = [config.name, config.date].filter(Boolean);
    if (lines.length > 0) {
      const fontSize = config.fontSize;
      ctx.font = `bold ${fontSize}px sans-serif`;
      const lineH = fontSize * 1.4;
      const padding = 12;
      const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const boxW = maxW + padding * 2;
      const boxH = lines.length * lineH + padding;

      let bx = 0, by = 0;
      const { position } = config;
      if (position.includes("right")) bx = canvas.width - boxW - 16;
      else if (position.includes("center")) bx = (canvas.width - boxW) / 2;
      else bx = 16;
      if (position.includes("top")) by = 16;
      else by = canvas.height - boxH - 16;

      const r = parseInt(config.bgColor.slice(1, 3), 16);
      const g = parseInt(config.bgColor.slice(3, 5), 16);
      const b = parseInt(config.bgColor.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r},${g},${b},${config.bgOpacity})`;
      const radius = 8;
      ctx.beginPath();
      // roundRect not available in all browsers — manual rounded rect fallback
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(bx, by, boxW, boxH, radius);
      } else {
        ctx.moveTo(bx + radius, by);
        ctx.lineTo(bx + boxW - radius, by);
        ctx.quadraticCurveTo(bx + boxW, by, bx + boxW, by + radius);
        ctx.lineTo(bx + boxW, by + boxH - radius);
        ctx.quadraticCurveTo(bx + boxW, by + boxH, bx + boxW - radius, by + boxH);
        ctx.lineTo(bx + radius, by + boxH);
        ctx.quadraticCurveTo(bx, by + boxH, bx, by + boxH - radius);
        ctx.lineTo(bx, by + radius);
        ctx.quadraticCurveTo(bx, by, bx + radius, by);
        ctx.closePath();
      }
      ctx.fill();

      ctx.fillStyle = config.fontColor;
      ctx.textBaseline = "top";
      lines.forEach((line, i) => {
        ctx.fillText(line, bx + padding, by + padding / 2 + i * lineH);
      });
    }

    const blob = await canvasToBlob(canvas, 0.88);
    const kb = parseFloat((blob.size / 1024).toFixed(1));
    const url = URL.createObjectURL(blob);
    setPreview(url);
    setOutput({ url, sizeKb: kb });
    setStatus("done");
    setMsg(`Done! Output: ${kb} KB`);
  }

  function reset() {
    setPreview(null);
    setOutput(null);
    setStatus("idle");
    setMsg("");
    imgRef.current = null;
  }

  const field = (label: string, node: React.ReactNode) => (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      {node}
    </div>
  );

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Type className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Name / Date Overlay</h2>
          <p className="text-sm text-slate-500">Overlays your typed name & chosen date onto any photo</p>
        </div>
      </div>

      {status === "idle" && <DropZone onFile={process} accept="image/*" sublabel="Any photo — JPG, PNG" />}

      <AnimatePresence>
        {status !== "idle" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <StatusBadge status={status} message={msg} />

            {/* Config controls */}
            <div className="grid grid-cols-2 gap-3">
              {field("Name", <input className={inputCls} placeholder="e.g. John Doe" value={config.name} onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))} />)}
              {field("Date", <input className={inputCls} type="date" value={config.date} onChange={(e) => setConfig((c) => ({ ...c, date: e.target.value }))} />)}
              {field("Position", (
                <select className={inputCls} value={config.position} onChange={(e) => setConfig((c) => ({ ...c, position: e.target.value as OverlayConfig["position"] }))}>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                </select>
              ))}
              {field(`Font Size: ${config.fontSize}px`, (
                <input type="range" min={16} max={72} value={config.fontSize} onChange={(e) => setConfig((c) => ({ ...c, fontSize: Number(e.target.value) }))} className="w-full accent-amber-500" />
              ))}
              {field("Text Color", (
                <div className="flex items-center gap-2">
                  <input type="color" value={config.fontColor} onChange={(e) => setConfig((c) => ({ ...c, fontColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200" />
                  <span className="text-sm text-slate-500">{config.fontColor}</span>
                </div>
              ))}
              {field("Background Color", (
                <div className="flex items-center gap-2">
                  <input type="color" value={config.bgColor} onChange={(e) => setConfig((c) => ({ ...c, bgColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200" />
                  <span className="text-sm text-slate-500">{config.bgColor}</span>
                </div>
              ))}
            </div>

            {preview && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview with overlay" className="w-full max-h-56 object-contain" />
              </motion.div>
            )}

            {output && (
              <div className="flex flex-wrap items-center gap-3">
                <DownloadBtn href={output.url} filename="photo_with_text.jpg" label="Download Photo" size={`${output.sizeKb} KB`} />
                <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                  <RefreshCcw className="h-4 w-4" /> Reset
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
}
