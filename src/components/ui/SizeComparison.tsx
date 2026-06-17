"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingDown } from "lucide-react";

interface Props {
  originalBytes: number;
  outputBytes: number;
}

function fmt(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / 1024).toFixed(1) + " KB";
}

export default function SizeComparison({ originalBytes, outputBytes }: Props) {
  const reduction = Math.round((1 - outputBytes / originalBytes) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5"
    >
      <TrendingDown className="h-4 w-4 flex-shrink-0 text-emerald-600" />
      <span className="text-sm font-semibold text-slate-500 line-through">{fmt(originalBytes)}</span>
      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
      <span className="text-sm font-bold text-emerald-700">{fmt(outputBytes)}</span>
      <span className="ml-auto rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
        -{reduction}%
      </span>
    </motion.div>
  );
}
