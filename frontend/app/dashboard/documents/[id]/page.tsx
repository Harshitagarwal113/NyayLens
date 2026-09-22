"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Document, DocumentAnalysisData } from "@nyaylens/shared";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { PdfViewer } from "@/components/workspace/PdfViewer";
import { AiPanel } from "@/components/workspace/AiPanel";
import DashboardLoading from "../../loading";

export default function DocumentWorkspacePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState<number | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAnalysis = async () => {
    setIsGenerating(true);
    try {
      const response = await apiClient.post(`/documents/${id}/analyze`, {});
      setAnalysis(response as DocumentAnalysisData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate analysis");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        // Fetch document metadata and signed URL
        const docData = await apiClient.get<Document>(`/documents/${id}`);
        setDocument(docData);
        
        // Fetch document analysis
        try {
          const analysisData = await apiClient.get<DocumentAnalysisData>(`/documents/${id}/analysis`);
          setAnalysis(analysisData);
        } catch (analysisErr: any) {
          // If analysis fails (e.g., still processing), we can still show the PDF
          // Use console.warn instead of console.error to prevent Next.js dev overlay from capturing it
          console.warn("Analysis not yet available:", analysisErr.message || "Unknown error");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load workspace");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchWorkspaceData();
    }
  }, [id]);

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (error || !document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Workspace Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-4 mt-2">
            <p>{error || "Document not found."}</p>
            <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm" className="w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Construct PDF viewer URL (mocking signed URL mechanism if downloadUrl is missing)
  const pdfUrl = document.downloadUrl || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/documents/${document.id}/download`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      {/* Workspace Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-200 bg-white shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="shrink-0 text-slate-500">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col overflow-hidden">
          <h1 className="text-sm font-bold text-slate-900 truncate">{document.filename}</h1>
          <span className="text-xs text-slate-500">Document Workspace</span>
        </div>
      </div>

      {/* Workspace Body */}
      <div className="flex-1 overflow-hidden">
        {/* @ts-expect-error ResizablePanelGroup types are missing direction in this version */}
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50} minSize={30}>
            <PdfViewer url={pdfUrl} currentPage={currentPage} />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={50} minSize={30}>
            {analysis ? (
              <AiPanel 
                documentId={document.id}
                analysis={analysis} 
                onPageSelect={(page) => setCurrentPage(page)} 
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-white">
                <div className="text-center p-8 flex flex-col items-center">
                  <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Ready for AI Analysis</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                    Generate a comprehensive breakdown of this document, including key clauses, risk areas, and a structured summary.
                  </p>
                  <Button onClick={generateAnalysis} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Analysis (This may take a minute)...
                      </>
                    ) : (
                      "Generate AI Analysis"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
