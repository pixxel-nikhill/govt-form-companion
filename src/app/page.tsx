"use client";

import { motion } from "framer-motion";
import { Lock, Zap, Globe } from "lucide-react";
import Header from "@/components/layout/Header";
import ToolCard from "@/components/layout/ToolCard";
import PassportPhotoTool from "@/components/tools/PassportPhotoTool";
import SignatureSharpenerTool from "@/components/tools/SignatureSharpenerTool";
import TextOverlayTool from "@/components/tools/TextOverlayTool";
import MarksheetPDFTool from "@/components/tools/MarksheetPDFTool";
import BgRemoverTool from "@/components/tools/BgRemoverTool";

const TOOL_ACCENTS = [
  "bg-gradient-to-r from-violet-500 to-indigo-500",
  "bg-gradient-to-r from-pink-500 to-rose-500",
  "bg-gradient-to-r from-amber-400 to-orange-500",
  "bg-gradient-to-r from-teal-400 to-cyan-500",
  "bg-gradient-to-r from-purple-500 to-fuchsia-500",
];

const PILLS = [
  { icon: Lock, label: "Zero data leaves your device", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { icon: Zap, label: "Instant client-side processing", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { icon: Globe, label: "Works fully offline", color: "text-sky-600 bg-sky-50 border-sky-200" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 mb-5 border border-indigo-100">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-medium text-indigo-700">All tools work 100% in your browser</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Govt Form{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Companion
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500 leading-relaxed">
            Prepare your photos and documents for government applications — passport photos, signatures, marksheets — all processed privately on your device.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {PILLS.map(({ icon: Icon, label, color }) => (
              <span key={label} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium ${color}`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </motion.section>

        {/* Tools Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <ToolCard accent={TOOL_ACCENTS[0]} index={0}>
            <PassportPhotoTool />
          </ToolCard>
          <ToolCard accent={TOOL_ACCENTS[1]} index={1}>
            <SignatureSharpenerTool />
          </ToolCard>
          <ToolCard accent={TOOL_ACCENTS[2]} index={2}>
            <TextOverlayTool />
          </ToolCard>
          <ToolCard accent={TOOL_ACCENTS[3]} index={3}>
            <MarksheetPDFTool />
          </ToolCard>
          <ToolCard accent={TOOL_ACCENTS[4]} index={4}>
            <BgRemoverTool />
          </ToolCard>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-14 text-center text-sm text-slate-400"
        >
          <p>All processing is done locally in your browser. No files are ever uploaded to any server.</p>
          <p className="mt-1 text-slate-300">Govt Form Companion &copy; {new Date().getFullYear()}</p>
        </motion.footer>
      </main>
    </div>
  );
}
