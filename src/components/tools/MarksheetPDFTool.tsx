"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { FileStack, GripVertical, Trash2, RefreshCcw } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import StatusBadge from "@/components/ui/StatusBadge";
import DownloadBtn from "@/components/ui/DownloadBtn";
import SizeComparison from "@/components/ui/SizeComparison";

type Status = "idle" | "processing" | "done" | "error";

interface PageItem {
  id: string;
  file: File;
  preview: string;
  name: string;
}

interface SizePreset {
  label: string;
  sublabel: string;
  maxKb: number;
  color: string;
  ring: string;
  bg: string;
  dot: string;
  btnBg: string;
}

const PRESETS: SizePreset[] = [
  {
    label: "Under 200 KB",
    sublabel: "Most portals",
    maxKb: 200,
    color: "text-teal-700",
    ring: "ring-teal-400",
    bg: "bg-teal-50",
    dot: "bg-teal-400",
    btnBg: "bg-teal-600 hover:bg-teal-700 shadow-teal-200",
  },
  {
    label: "Under 500 KB",
    sublabel: "College forms",
    maxKb: 500,
    color: "text-cyan-700",
    ring: "ring-cyan-400",
    bg: "bg-cyan-50",
    dot: "bg-cyan-400",
    btnBg: "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-200",
  },
  {
    label: "Under 1 MB",
    sublabel: "High quality",
    maxKb: 1024,
    color: "text-sky-700",
    ring: "ring-sky-400",
    bg: "bg-sky-50",
    dot: "bg-sky-400",
    btnBg: "bg-sky-600 hover:bg-sky-700 shadow-sky-200",
  },
];

export default function MarksheetPDFTool() {
  const [selected, setSelected] = useState(0);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const [output, setOutput] = useState<{ url: string; sizeKb: number; originalBytes: number } | null>(null);

  const addFiles = useCallback((files: File[]) => {
    const items: PageItem[] = files.map((f) => ({
      id: `${f.name}-${Math.random()}`,
      file: f,
      preview: URL.createObjectURL(f),
      name: f.name,
    }));
    setPages((p) => [...p, ...items]);
  }, []);

  function removePage(id: string) {
    setPages((p) => p.filter((x) => x.id !== id));
  }

  async function buildPDF() {
    if (pages.length === 0) return;
    const preset = PRESETS[selected];
    setStatus("processing");
    setMsg("Loading jsPDF…");
    setOutput(null);

    try {
      const { jsPDF } = await import("jspdf");
      setMsg(`Composing ${pages.length} page(s)…`);

      // Binary-search image quality to stay under maxKb
      let lo = 0.02, hi = 0.92, bestQuality = 0.5;

      for (let attempt = 0; attempt < 16; attempt++) {
        const mid = (lo + hi) / 2;
        const buf = await makePDFBuffer(pages, mid, jsPDF);
        const kb = buf.byteLength / 1024;

        if (kb <= preset.maxKb) {
          bestQuality = mid;
          lo = mid; // try higher quality
        } else {
          hi = mid; // too big, reduce quality
        }

        // Early exit if comfortably under limit
        if (kb <= preset.maxKb * 0.95 && kb >= preset.maxKb * 0.6) break;
      }

      setMsg("Finalising PDF…");
      const finalBuf = await makePDFBuffer(pages, bestQuality, jsPDF);
      const blob = new Blob([finalBuf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const kb = parseFloat((finalBuf.byteLength / 1024).toFixed(1));
      const originalBytes = pages.reduce((sum, p) => sum + p.file.size, 0);

      setOutput({ url, sizeKb: kb, originalBytes });
      setStatus("done");
      setMsg(`PDF ready — ${kb} KB • ${pages.length} page(s)`);
    } catch (e) {
      console.error(e);
      setStatus("error");
      setMsg("Failed to build PDF. Try fewer or smaller images.");
    }
  }

  function reset() {
    setPages([]);
    setOutput(null);
    setStatus("idle");
    setMsg("");
  }

  const preset = PRESETS[selected];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
          <FileStack className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Document PDF Compiler</h2>
          <p className="text-sm text-slate-500">Add pages, reorder, export — stays under your size limit</p>
        </div>
      </div>

      {/* Size preset toggles */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Maximum PDF Size</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p, i) => (
            <motion.button
              key={p.label}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelected(i)}
              className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition-all duration-200
                ${selected === i
                  ? `border-transparent ring-2 ${p.ring} ${p.bg} shadow-sm`
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                }`}
            >
              {selected === i && (
                <motion.span
                  layoutId="pdf-preset-dot"
                  className={`absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${p.dot}`}
                />
              )}
              <span className={`text-xs font-bold leading-tight ${selected === i ? p.color : "text-slate-700"}`}>{p.label}</span>
              <span className={`text-xs ${selected === i ? p.color + " opacity-70" : "text-slate-400"}`}>{p.sublabel}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <DropZone onFile={() => {}} onFiles={addFiles} accept="image/*" multiple label="Add document images" sublabel="Select multiple — drag to reorder below" />

      {/* Page list */}
      <AnimatePresence>
        {pages.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">{pages.length} page(s) — drag to reorder</p>
              <button onClick={() => setPages([])} className="text-xs text-red-400 hover:text-red-600 transition-colors">Clear all</button>
            </div>

            <Reorder.Group axis="y" values={pages} onReorder={setPages} className="space-y-2">
              {pages.map((p, i) => (
                <Reorder.Item key={p.id} value={p}>
                  <motion.div layout className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                    <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-slate-300 active:cursor-grabbing" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.preview} alt={p.name} className="h-12 w-16 rounded-lg object-cover border border-slate-100" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">Page {i + 1}</p>
                      <p className="truncate text-xs text-slate-400">{p.name}</p>
                    </div>
                    <button onClick={() => removePage(p.id)} className="flex-shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {/* Build button */}
            {!output && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={buildPDF}
                disabled={status === "processing"}
                className={`w-full rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-60 ${preset.btnBg}`}
              >
                {status === "processing" ? "Building PDF…" : `Build PDF — ${preset.label} (${pages.length} pages)`}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status + download */}
      <AnimatePresence>
        {status !== "idle" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <StatusBadge status={status} message={msg} />
            {output && <SizeComparison originalBytes={output.originalBytes} outputBytes={output.sizeKb * 1024} />}
            {output && (
              <div className="flex flex-wrap items-center gap-3">
                <DownloadBtn href={output.url} filename="document_compiled.pdf" label="Download PDF" size={`${output.sizeKb} KB`} />
                <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                  <RefreshCcw className="h-4 w-4" /> Start Over
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

async function makePDFBuffer(
  pages: { file: File }[],
  imgQuality: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsPDF: any
): Promise<ArrayBuffer> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();
    const canvas = await fileToCanvas(pages[i].file, W * 2, H * 2);
    const dataUrl = canvas.toDataURL("image/jpeg", imgQuality);
    pdf.addImage(dataUrl, "JPEG", 0, 0, W, H);
  }

  return pdf.output("arraybuffer") as ArrayBuffer;
}

function fileToCanvas(file: File, maxW: number, maxH: number): Promise<HTMLCanvasElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      res(canvas);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}
