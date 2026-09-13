"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderArchive,
  Search,
  BookOpen,
  FileText,
  Eye,
  Download,
  Presentation,
  FileSpreadsheet,
  Archive,
  ImageIcon,
  FileCode,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PdfViewerModal } from "@/components/materials/PdfViewerModal";
import { formatDate } from "@/lib/utils";

interface GlobalMaterialItem {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  folder: string | null;
  createdAt: string;
  group: {
    id: string;
    name: string;
    type: string;
  };
  uploader: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
  };
}

export default function GlobalMaterialsPage() {
  const [materials, setMaterials] = useState<GlobalMaterialItem[]>([]);
  const [userGroups, setUserGroups] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [previewPdf, setPreviewPdf] = useState<{ title: string; fileUrl: string } | null>(null);

  const fetchGlobalMaterials = async (groupId?: string, search?: string) => {
    try {
      const params = new URLSearchParams();
      if (groupId) params.append("groupId", groupId);
      if (search) params.append("search", search);

      const res = await fetch(`/api/materials?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials || []);
        setUserGroups(data.userGroups || []);
      }
    } catch (err) {
      console.error("Failed to fetch global materials:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalMaterials(selectedGroupId, searchQuery);
  }, [selectedGroupId, searchQuery]);

  const getFileIcon = (fileType: string) => {
    switch (fileType.toUpperCase()) {
      case "PDF":
        return <FileText className="w-5 h-5 text-rose-500" />;
      case "DOC":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "PPT":
        return <Presentation className="w-5 h-5 text-amber-500" />;
      case "SHEET":
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case "IMAGE":
        return <ImageIcon className="w-5 h-5 text-purple-500" />;
      case "ARCHIVE":
        return <Archive className="w-5 h-5 text-orange-500" />;
      default:
        return <FileCode className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-rose-500/10 border border-slate-200/80 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/80 dark:bg-slate-900/80 text-blue-600 dark:text-blue-400 mb-2 border border-blue-200/50 dark:border-blue-900/40">
          <FolderArchive className="w-3.5 h-3.5" />
          Institution Knowledge Base
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
          Course Materials Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
          Unified repository for slides, PDFs, problem sets, and past examination papers across all your enrolled academic groups.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Group selector dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-medium"
          >
            <option value="">All Enrolled Groups ({userGroups.length})</option>
            {userGroups.map((g) => (
              <option key={g.id} value={g.id}>
                [{g.type}] {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or topic..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </div>
      </div>

      {/* Materials List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-36 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 animate-pulse p-6"
            />
          ))}
        </div>
      ) : materials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((mat) => {
            const isPdf = mat.fileType.toUpperCase() === "PDF";
            return (
              <div
                key={mat.id}
                className="flex flex-col justify-between p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <Link
                      href={`/groups/${mat.group.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline truncate max-w-[200px]"
                    >
                      <BookOpen className="w-3 h-3 shrink-0" />
                      {mat.group.name}
                    </Link>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                      {mat.fileType}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shrink-0 mt-0.5">
                      {getFileIcon(mat.fileType)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={mat.title}>
                        {mat.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {mat.folder || "General"} • {formatDate(mat.createdAt)}
                      </p>
                    </div>
                  </div>

                  {mat.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {mat.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 truncate">
                    By {mat.uploader.name}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPdf ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewPdf({ title: mat.title, fileUrl: mat.fileUrl })}
                        className="text-xs h-7 gap-1 font-semibold"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </Button>
                    ) : (
                      <a
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-7"
                      >
                        <Eye className="w-3 h-3" />
                        Open
                      </a>
                    )}

                    <a
                      href={mat.fileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-7 w-7 justify-center"
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
          <FolderArchive className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No course materials found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedGroupId || searchQuery
              ? "No files match your filter or search query."
              : "You can upload course materials inside your enrolled academic groups."}
          </p>
          <Link href="/groups">
            <Button size="sm" variant="outline" className="mt-4 gap-1.5 text-xs font-semibold">
              Browse Academic Groups
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {previewPdf && (
        <PdfViewerModal
          isOpen={Boolean(previewPdf)}
          onClose={() => setPreviewPdf(null)}
          title={previewPdf.title}
          fileUrl={previewPdf.fileUrl}
        />
      )}
    </div>
  );
}
