"use client";

import { motion } from "framer-motion";
import { Download } from "lucide-react";

interface Props {
  href: string;
  filename: string;
  label?: string;
  size?: string;
}

export default function DownloadBtn({ href, filename, label = "Download", size }: Props) {
  return (
    <motion.a
      href={href}
      download={filename}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors"
    >
      <Download className="h-4 w-4" />
      {label}
      {size && <span className="ml-1 rounded-full bg-indigo-500 px-2 py-0.5 text-xs">{size}</span>}
    </motion.a>
  );
}
