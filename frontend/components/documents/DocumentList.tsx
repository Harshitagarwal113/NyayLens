"use client";

import { FileText, Trash2, Loader2, AlertCircle, FileSearch, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Document } from "@nyaylens/shared";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface DocumentListProps {
  documents: Document[];
  onDeleteSuccess: () => void;
}

export function DocumentList({ documents, onDeleteSuccess }: DocumentListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 rounded-full px-3 py-1 font-semibold">Analyzed</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 rounded-full px-3 py-1 font-semibold"><Loader2 className="h-3 w-3 animate-spin"/> Processing...</Badge>;
      case 'failed':
      case 'failed_processing':
        return <Badge variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 rounded-full px-3 py-1 font-semibold">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const confirmDelete = (doc: Document) => {
    setDocToDelete(doc);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    
    setDeletingId(docToDelete.id);
    setDeleteError("");
    
    try {
      await apiClient.delete(`/documents/${docToDelete.id}`);
      setDocToDelete(null);
      onDeleteSuccess();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
        <div className="bg-slate-50 p-5 rounded-full mb-4">
          <FileSearch className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-1">No documents yet</h3>
        <p className="text-sm text-slate-500 text-center max-w-sm mt-1">
          Upload your first legal document to begin AI-powered analysis, Q&A, and insight generation.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[400px]">Document</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id} className="group hover:bg-slate-50/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="truncate max-w-[300px]">{doc.filename}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {format(new Date(doc.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                      disabled={doc.status !== 'processed'}
                    >
                      Analyze
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => confirmDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-slate-900">{docToDelete?.filename}</span>? 
              This action cannot be undone and all associated analysis will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          
          {deleteError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {deleteError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDocToDelete(null)} disabled={!!deletingId}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!!deletingId}>
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Document"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
