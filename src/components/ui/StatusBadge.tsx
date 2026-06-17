"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Status = "idle" | "processing" | "done" | "error";

interface Props {
  status: Status;
  message?: string;
}

const config: Record<Status, { icon: React.ReactNode; bg: string; text: string }> = {
  idle: { icon: null, bg: "", text: "" },
  processing: {
    icon: <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />,
    bg: "bg-indigo-50 border-indigo-200",
    text: "text-indigo-700",
  },
  done: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
  },
  error: {
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
  },
};

export default function StatusBadge({ status, message }: Props) {
  if (status === "idle" || !message) return null;
  const { icon, bg, text } = config[status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${bg} ${text}`}
    >
      {icon}
      {message}
    </motion.div>
  );
}
