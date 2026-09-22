"use client";

import { useState, useRef } from "react";
import { UploadCloud, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { UploadDocumentResponse } from "@nyaylens/shared";

interface UploadModalProps {
  onUploadComplete: () => void;
}

export function UploadModal({ onUploadComplete }: UploadModalProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are supported");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type !== "application/pdf") {
        setError("Only PDF files are supported");
        return;
      }
      setFile(droppedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      await apiClient.post<UploadDocumentResponse>("/documents", formData);
      
      setFile(null);
      setOpen(false);
      onUploadComplete();
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setFile(null);
        setError("");
      }
    }}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Upload Document
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Legal Document</DialogTitle>
          <DialogDescription>
            Select a PDF document to upload for AI analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {!file ? (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
                hover:bg-slate-50 hover:border-blue-400 ${error ? 'border-red-400' : 'border-slate-300'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="bg-slate-100 p-3 rounded-full mb-2">
                <UploadCloud className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-900">Click or drag and drop to upload</p>
              <p className="text-xs text-slate-500">PDF up to 10MB</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                  <File className="h-5 w-5 text-blue-600" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-500 hover:text-red-600 shrink-0"
                onClick={() => setFile(null)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload & Process"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
