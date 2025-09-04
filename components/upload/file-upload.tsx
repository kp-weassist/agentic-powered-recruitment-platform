"use client";

import { useCallback, useEffect, useState, useId } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileUp, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function FileUpload({
  bucketId,
  onUploaded,
  accept,
  label,
  pathPrefix,
  onError,
}: {
  bucketId: string;
  onUploaded: (publicUrl: string, path: string) => void;
  accept?: string;
  label?: string;
  pathPrefix?: string;
  onError?: (message: string) => void;
}) {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPublicUrl, setUploadedPublicUrl] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const inputId = useId();

  const isImageMode = (accept || "").includes("image");

  // Persist last uploaded file info per user/bucket/pathPrefix
  const storageKeyFor = (uid: string) => `upload:${uid}:${bucketId}:${pathPrefix || ""}`;

  const handleUpload = async (selectedFile?: File | null) => {
    const f = selectedFile ?? file;
    if (!f) return;
    setUploading(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        const msg = "You must be signed in to upload.";
        setError(msg);
        onError?.(msg);
        return;
      }
      const safeName = f.name
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^A-Za-z0-9_.-]/g, "-");
      const name = `${Date.now()}-${safeName}`;
      const path = `${uid}/${pathPrefix ? `${pathPrefix}/` : ""}${name}`;
      const { error } = await supabase.storage.from(bucketId).upload(path, f, { upsert: false, contentType: f.type });
      if (error) throw error;
      const { data: urlData } = await supabase.storage.from(bucketId).getPublicUrl(path);
      onUploaded(urlData.publicUrl, path);
      // Save last uploaded info for UX continuity
      setUploadedPublicUrl(urlData.publicUrl);
      setUploadedPath(path);
      setUploadedFileName(name);
      try {
        const key = storageKeyFor(uid);
        localStorage.setItem(key, JSON.stringify({ publicUrl: urlData.publicUrl, path, fileName: name }));
      } catch {}
      // Clear local selection; uploaded file is now the source of truth
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setIsImage(false);
      toast.success("File uploaded");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Upload failed";
      setError(message);
      onError?.(message);
      // eslint-disable-next-line no-console
      console.error("Upload error", message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const onDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setFile(f);
      setIsImage(f.type.startsWith("image/"));
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      setIsImage(f.type.startsWith("image/"));
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      if (isImageMode) void handleUpload(f);
    } else {
      setPreviewUrl(null);
      setIsImage(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Load previously uploaded file info (if any)
  useEffect(() => {
    const load = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;
        const raw = localStorage.getItem(storageKeyFor(uid));
        if (!raw) return;
        const parsed = JSON.parse(raw) as { publicUrl?: string; path?: string; fileName?: string };
        if (parsed?.publicUrl && parsed?.path) {
          setUploadedPublicUrl(parsed.publicUrl);
          setUploadedPath(parsed.path);
          setUploadedFileName(parsed.fileName || parsed.path.split("/").pop() || null);
        }
      } catch {
        // ignore
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setIsImage(false);
  };

  const clearUploadedInfo = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (uid) localStorage.removeItem(storageKeyFor(uid));
    } catch {}
    setUploadedPublicUrl(null);
    setUploadedPath(null);
    setUploadedFileName(null);
  };

  if (isImageMode) {
    // Compact, avatar-style UI for images (small footprint)
    return (
      <div className="space-y-1">
        {label ? <Label>{label}</Label> : null}
        <div className="relative inline-block group">
          <input id={inputId} type="file" accept={accept} onChange={onInputChange} className="hidden" />
          <label htmlFor={inputId} className="block cursor-pointer">
            <Avatar className="size-16">
              {previewUrl || uploadedPublicUrl ? (
                <AvatarImage src={(previewUrl || uploadedPublicUrl) as string} alt="Upload preview" />
              ) : (
                <AvatarFallback>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Upload className="h-4 w-4 text-white" />}
            </div>
          </label>
          {(file || uploadedPublicUrl) ? (
            <button
              type="button"
              onClick={() => (file ? clearSelectedFile() : void clearUploadedInfo())}
              className="absolute -bottom-1 -right-1 inline-flex items-center justify-center rounded-full border bg-background p-1 hover:bg-accent"
              aria-label="Clear image"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ) : null}
        </div>
        {error ? <div className="text-xs text-destructive">{error}</div> : null}
      </div>
    );
  }

  // Dropzone UI for non-image files (pdf/docs)
  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      <div
        className={`relative rounded-md border-2 border-dashed p-6 text-center ${dragActive ? "border-primary bg-primary/5" : "border-border"}`}
        onDragEnter={onDrag}
        onDragOver={onDrag}
        onDragLeave={onDrag}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept={accept}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={onInputChange}
        />
        <div className="flex flex-col items-center gap-2">
          <FileUp className="h-6 w-6 text-muted-foreground" />
          <div className="text-sm">
            Drag & drop to upload, or click to choose a file
          </div>
          {file ? (
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">Selected: {file.name}</div>
              <button type="button" onClick={clearSelectedFile} className="p-1 rounded hover:bg-accent" aria-label="Remove selected">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <Button type="button" variant="outline" disabled={!file || uploading} onClick={() => void handleUpload()} className="w-full">
        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        Upload
      </Button>
      {previewUrl ? (
        <div className="mt-2">
          {isImage ? (
            <img src={previewUrl} alt="Preview" className="h-24 w-24 rounded-md border object-cover" />
          ) : (
            <div className="text-xs text-muted-foreground">Preview not available for this file type.</div>
          )}
        </div>
      ) : null}
      {!file && uploadedPublicUrl ? (
        <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between gap-2 rounded-md border p-2">
          <a className="text-primary underline underline-offset-4 truncate" href={uploadedPublicUrl} target="_blank" rel="noopener noreferrer">
            Previously uploaded: {uploadedFileName || "file"}
          </a>
          <button type="button" onClick={clearUploadedInfo} className="p-1 rounded hover:bg-accent" aria-label="Forget uploaded">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : null}
      {error ? <div className="text-xs text-destructive">{error}</div> : null}
    </div>
  );
}


