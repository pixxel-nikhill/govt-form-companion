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
      className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-md shadow-purple-100 border border-purple-100 hover:shadow-lg hover:shadow-purple-200 transition-all duration-300`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
      {children}
    </motion.div>
  );
}
