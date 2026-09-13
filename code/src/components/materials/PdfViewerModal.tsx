"use client";

import React from "react";
import { X, ExternalLink, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
}

export function PdfViewerModal({
  isOpen,
  onClose,
  title,
  fileUrl,
}: PdfViewerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[88vh] rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B0F19] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate font-[family-name:var(--font-heading)]">
                {title}
              </h3>
              <p className="text-xs text-slate-400 truncate">Course Material Preview</p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>

            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Document Frame */}
        <div className="relative flex-1 w-full h-full bg-slate-900">
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=1`}
            title={title}
            className="w-full h-full border-0"
          />
        </div>

        {/* Footer fallback */}
        <div className="px-5 py-2 text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          Having trouble viewing?{" "}
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-600 dark:text-rose-400 underline font-medium hover:text-rose-500"
          >
            Click here to open document directly
          </a>
        </div>
      </div>
    </div>
  );
}
