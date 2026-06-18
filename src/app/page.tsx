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
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
            Prepare passport photos, signatures, and marksheets for government forms —{" "}
            <span className="font-semibold text-slate-800">entirely in your browser.</span>{" "}
            No uploads. No servers. No third party ever sees your documents.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 max-w-lg mx-auto">
            {PILLS.map(({ icon: Icon, label, color }) => (
              <span key={label} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium ${color}`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </motion.section>

        {/* Tools Grid */}
        <div className="grid gap-6 md:grid-cols-2 [&>*:last-child:nth-child(odd)]:md:col-span-2 [&>*:last-child:nth-child(odd)]:md:max-w-xl [&>*:last-child:nth-child(odd)]:md:mx-auto [&>*:last-child:nth-child(odd)]:md:w-full">
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
          className="mt-14 border-t border-slate-200 pt-8 pb-6 text-center text-sm text-slate-600"
        >
          <p>
            Designed and Developed by{" "}
            <span className="font-semibold text-slate-800">Nikhil Pathak</span>.
          </p>
          <p className="mt-1">
            To send feedback, report a bug, or just say hi, feel free to reach out!
          </p>
          <div className="mt-4 flex items-center justify-center gap-6">
            <a
              href="mailto:pathakn620@gmail.com"
              className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-indigo-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Email
            </a>
            <a
              href="https://www.linkedin.com/in/nikhil-pathak-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-indigo-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              LinkedIn
            </a>
          </div>
          <p className="mt-5 text-xs text-slate-400">
            All processing is done locally in your browser. No files are ever uploaded to any server.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Nikhil Pathak. All rights reserved.
          </p>
        </motion.footer>
      </main>
    </div>
  );
}