"use client";

import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
  accent: string;
  index: number;
}

export default function ToolCard({ children, accent, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 hover:shadow-md hover:ring-slate-200 transition-all duration-300`}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 ${accent}`} />
      {children}
    </motion.div>
  );
}
