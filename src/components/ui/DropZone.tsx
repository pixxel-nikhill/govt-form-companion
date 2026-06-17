"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImageIcon } from "lucide-react";

interface DropZoneProps {
  onFile: (file: File) => void;
  accept?: string;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
  label?: string;
  sublabel?: string;
}

export default function DropZone({ onFile, onFiles, accept = "image/*", multiple = false, label, sublabel }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    if (multiple && onFiles) {
      onFiles(files);
    } else {
      onFile(files[0]);
    }
  }, [onFile, onFiles, multiple]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (multiple && onFiles) {
      onFiles(files);
    } else {
      onFile(files[0]);
    }
    e.target.value = "";
  };

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all duration-300
        ${isDragging ? "border-indigo-500 bg-indigo-50 scale-[1.01] drop-active" : "border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"}`}
    >
      <input type="file" accept={accept} multiple={multiple} onChange={handleChange} className="sr-only" />
      <AnimatePresence mode="wait">
        <motion.div
          key={isDragging ? "drag" : "idle"}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${isDragging ? "bg-indigo-500" : "bg-indigo-100 group-hover:bg-indigo-200"}`}
        >
          {isDragging ? (
            <ImageIcon className="h-7 w-7 text-white" />
          ) : (
            <Upload className="h-7 w-7 text-indigo-500" />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="text-center">
        <p className="font-semibold text-slate-700">{label ?? (isDragging ? "Drop it!" : "Drag & drop or click to upload")}</p>
        <p className="mt-1 text-sm text-slate-400">{sublabel ?? (multiple ? "Select multiple files" : "Single file")}</p>
      </div>
    </label>
  );
}
