"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Cpu, Layers } from "lucide-react";

export default function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-lg leading-none">Govt Form Companion</span>
            <p className="text-xs text-slate-400 leading-none mt-0.5">Document Toolkit</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700">All-in-One Tool</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">100% Privacy — Files & Docs Never Leave Your Device</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
