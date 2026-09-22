"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Document } from "@nyaylens/shared";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DocumentList } from "@/components/documents/DocumentList";
import { UploadModal } from "@/components/documents/UploadModal";
import { CompareModal } from "@/components/documents/CompareModal";
import DashboardLoading from "../loading";

function MyDocumentsContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q")?.toLowerCase() || "";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const data = await apiClient.get<Document[]>("/documents");
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Polling mechanism to refresh list if there are processing documents
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing');
    
    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchDocuments();
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [documents, fetchDocuments]);

  if (isLoading && documents.length === 0) {
    return <DashboardLoading />;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            My Documents
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">Browse, manage, and analyze your uploaded files.</p>
        </div>
        <div className="flex items-center gap-3">
          <CompareModal documents={documents} />
          <UploadModal onUploadComplete={fetchDocuments} />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load data</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <p>{error}</p>
            <Button onClick={fetchDocuments} variant="outline" size="sm" className="w-fit gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <DocumentList 
          documents={documents.filter(doc => doc.filename.toLowerCase().includes(query))} 
          onDeleteSuccess={fetchDocuments} 
        />
      )}
    </div>
  );
}

export default function MyDocumentsPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <MyDocumentsContent />
    </Suspense>
  );
}
