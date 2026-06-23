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
  "bg-[#7c3aed]",
  "bg-[#e8176b]",
  "bg-[#2563eb]",
  "bg-[#7c3aed]",
  "bg-[#e8176b]",
];

const PILLS = [
  { icon: Lock, label: "Zero data leaves your device" },
  { icon: Zap, label: "Instant client-side processing" },
  { icon: Globe, label: "Works fully offline" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 mb-5 border border-white/20">
            <span className="h-2 w-2 rounded-full bg-[#e8176b] animate-pulse" />
            <span className="text-sm font-medium text-white/80">All tools work 100% in your browser</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Govt Form{" "}
            <span className="text-[#c084fc]">Companion</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-white/60 leading-relaxed">
            Prepare passport photos, signatures, and marksheets for government forms —{" "}
            <span className="font-semibold text-white/90">entirely in your browser.</span>{" "}
            No uploads. No servers. No third party ever sees your documents.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
            {PILLS.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-medium text-white/75">
                <Icon className="h-3.5 w-3.5 text-[#e8176b]" />
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
          className="mt-14 border-t border-white/10 pt-8 pb-6 text-center text-sm text-white/50"
        >
          <p>
            Designed and Developed by{" "}
            <span className="font-semibold text-white/90">Nikhil Pathak</span>.
          </p>
          <p className="mt-1">
            To send feedback, report a bug, or just say hi, feel free to reach out!
          </p>
          <div className="mt-4 flex items-center justify-center gap-6">
            <a
              href="mailto:pathakn620@gmail.com"
              className="inline-flex items-center gap-1.5 text-white/50 transition-colors hover:text-[#e8176b]"
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
              className="inline-flex items-center gap-1.5 text-white/50 transition-colors hover:text-[#e8176b]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              LinkedIn
            </a>
          </div>
          <p className="mt-5 text-xs text-white/30">
            All processing is done locally in your browser. No files are ever uploaded to any server.
          </p>
          <p className="mt-2 text-xs text-white/30">
            &copy; {new Date().getFullYear()} Nikhil Pathak. All rights reserved.
          </p>
        </motion.footer>
      </main>
    </div>
  );
}