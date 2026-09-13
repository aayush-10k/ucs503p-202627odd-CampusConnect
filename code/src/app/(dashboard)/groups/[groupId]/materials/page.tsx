"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FileText,
  UploadCloud,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  Download,
  Trash2,
  Folder,
  MessageSquare,
  Users,
  FileSpreadsheet,
  Presentation,
  Archive,
  ImageIcon,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FileUploader } from "@/components/materials/FileUploader";
import { PdfViewerModal } from "@/components/materials/PdfViewerModal";
import { formatDate } from "@/lib/utils";

interface MaterialItem {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  folder: string | null;
  createdAt: string;
  uploader: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
  };
}

export default function GroupMaterialsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const isPlatformAdmin = session?.user?.role === "ADMIN";

  const [groupName, setGroupName] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<{ title: string; fileUrl: string } | null>(null);

  const fetchMaterials = async (folder?: string, search?: string) => {
    try {
      const params = new URLSearchParams();
      if (folder && folder !== "ALL") params.append("folder", folder);
      if (search) params.append("search", search);

      const [matRes, grpRes] = await Promise.all([
        fetch(`/api/groups/${groupId}/materials?${params.toString()}`),
        fetch(`/api/groups/${groupId}`),
      ]);

      if (matRes.ok) {
        const matData = await matRes.json();
        setMaterials(matData.materials || []);
        setFolders(matData.folders || []);
      }

      if (grpRes.ok) {
        const grpData = await grpRes.json();
        setGroupName(grpData.group?.name || "Group");
        setCurrentUserRole(grpData.group?.currentUserRole || null);
      }
    } catch (err) {
      console.error("Failed to fetch materials:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials(selectedFolder, searchQuery);
  }, [groupId, selectedFolder, searchQuery]);

  const handleDeleteMaterial = async (materialId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchMaterials(selectedFolder, searchQuery);
      }
    } catch (err) {
      console.error("Failed to delete material:", err);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toUpperCase()) {
      case "PDF":
        return <FileText className="w-6 h-6 text-rose-500" />;
      case "DOC":
        return <FileText className="w-6 h-6 text-blue-500" />;
      case "PPT":
        return <Presentation className="w-6 h-6 text-amber-500" />;
      case "SHEET":
        return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
      case "IMAGE":
        return <ImageIcon className="w-6 h-6 text-purple-500" />;
      case "ARCHIVE":
        return <Archive className="w-6 h-6 text-orange-500" />;
      default:
        return <FileCode className="w-6 h-6 text-slate-400" />;
    }
  };

  const isGroupAdmin = currentUserRole === "ADMIN" || isPlatformAdmin;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {groupName || "Group"}
      </Link>

      {/* Header with Sub-tabs */}
      <div className="rounded-3xl border border-rose-100/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
              {groupName} — Course Materials
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Centralized repository for syllabus notes, laboratory manuals, and lecture slides.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploaderOpen(true)}
            className="gap-2 shrink-0 self-start sm:self-center"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Material
          </Button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <Link
            href={`/groups/${groupId}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Group Feed
          </Link>

          <Link
            href={`/groups/${groupId}/materials`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Course Materials ({materials.length})
          </Link>

          <Link
            href={`/groups/${groupId}/members`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Users className="w-4 h-4" />
            Members
          </Link>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Folder pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setSelectedFolder("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFolder === "ALL"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
            }`}
          >
            All Folders
          </button>

          {folders.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSelectedFolder(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFolder === f
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              <Folder className="w-3 h-3 text-rose-500" />
              {f}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter files by title..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </div>
      </div>

      {/* Materials Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 animate-pulse p-6"
            />
          ))}
        </div>
      ) : materials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((mat) => {
            const isPdf = mat.fileType.toUpperCase() === "PDF";
            const canDelete =
              mat.uploader.id === currentUserId || isGroupAdmin || isPlatformAdmin;

            return (
              <div
                key={mat.id}
                className="flex flex-col justify-between p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                        {getFileIcon(mat.fileType)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={mat.title}>
                          {mat.title}
                        </h4>
                        <span className="inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          {mat.folder || "General"}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                      {mat.fileType}
                    </span>
                  </div>

                  {mat.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {mat.description}
                    </p>
                  )}

                  <div className="mt-3 text-[11px] text-slate-400">
                    Uploaded by <span className="font-semibold text-slate-600 dark:text-slate-300">{mat.uploader.name}</span> • {formatDate(mat.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isPdf ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewPdf({ title: mat.title, fileUrl: mat.fileUrl })}
                        className="text-xs h-8 gap-1 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </Button>
                    ) : (
                      <a
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-8"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Open
                      </a>
                    )}

                    <a
                      href={mat.fileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-8"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
          <FileText className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No course materials found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedFolder !== "ALL" || searchQuery
              ? "No files match your filter or search keyword."
              : "Upload lecture notes, presentations, or lab manuals to share with this group."}
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsUploaderOpen(true)}
            className="mt-4 gap-2 text-xs"
          >
            <UploadCloud className="w-4 h-4" />
            Upload First Material
          </Button>
        </div>
      )}

      {/* File Uploader Modal */}
      <FileUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        groupId={groupId}
        existingFolders={folders}
        onMaterialUploaded={() => fetchMaterials(selectedFolder, searchQuery)}
      />

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
