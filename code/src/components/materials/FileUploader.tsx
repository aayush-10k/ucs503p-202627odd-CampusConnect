"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle, Folder } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FileUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  existingFolders?: string[];
  onMaterialUploaded: () => void;
}

export function FileUploader({
  isOpen,
  onClose,
  groupId,
  existingFolders = [],
  onMaterialUploaded,
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [folder, setFolder] = useState("Lectures");
  const [customFolder, setCustomFolder] = useState("");
  const [isCustomFolder, setIsCustomFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const defaultPresets = ["Lectures", "Assignments", "Lab Notes", "Syllabus", "Exams", "General"];
  const allFolderPresets = Array.from(new Set([...defaultPresets, ...existingFolders]));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setTitle(cleanName);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setTitle(cleanName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Please provide a title for the material.");
      return;
    }

    const finalFolder = isCustomFolder ? (customFolder.trim() || "General") : folder;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }
      formData.append("folder", finalFolder);

      const res = await fetch(`/api/groups/${groupId}/materials`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload course material.");
      }

      // Reset
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      onMaterialUploaded();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to upload course material.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B0F19] p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-2">
            Course Repository
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
            Upload Course Material
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Share slides, lecture PDFs, notes, or lab guidelines with all group members.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag and Drop Zone */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg"
              className="hidden"
            />

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                selectedFile
                  ? "border-emerald-500/80 bg-emerald-500/5 dark:bg-emerald-500/10"
                  : "border-slate-300 dark:border-slate-800 hover:border-rose-500/60 bg-slate-50/50 dark:bg-slate-900/50"
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to browse or drag and drop file
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PDF, DOCX, PPTX, TXT, or ZIP (up to 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Material Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lecture 04 — Distributed System Patterns"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
            />
          </div>

          {/* Folder Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Folder / Category
            </label>
            {!isCustomFolder ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {allFolderPresets.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFolder(f)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                        folder === f
                          ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustomFolder(true)}
                    className="px-3 py-1 rounded-xl text-xs font-medium border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    + Custom Folder
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customFolder}
                  onChange={(e) => setCustomFolder(e.target.value)}
                  placeholder="Type new folder name (e.g. Quiz Solutions)"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomFolder(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Recommended reading chapters, submission instructions, or prerequisites..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isUploading}>
              Upload Material
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
