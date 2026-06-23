"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 bg-[#5b21b6] border-b border-purple-900/20"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8176b]">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <div>
            <span className="font-bold text-white text-lg leading-none tracking-tight">Govt Form Companion</span>
            <p className="text-xs text-white/40 leading-none mt-0.5">Document Toolkit</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3.5 py-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#e8176b]" />
          <span className="text-xs font-medium text-white/80">Files never leave your device</span>
        </div>
      </div>
    </motion.header>
  );
}
