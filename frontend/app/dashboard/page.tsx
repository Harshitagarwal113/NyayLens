"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { Document } from "@nyaylens/shared";
import { FileText, CheckCircle, AlertCircle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import DashboardLoading from "./loading";

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await apiClient.get<Document[]>("/documents");
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Polling mechanism for live updates
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing');
    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchDocuments();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [documents, fetchDocuments]);

  if (isLoading) {
    return <DashboardLoading />;
  }

  const processedDocs = documents.filter(d => d.status === 'processed');
  const pendingFailedDocs = documents.filter(d => d.status !== 'processed');

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">Overview of your document processing workspace.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/documents')} variant="default" className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all rounded-full px-6">
          View All Documents <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-white p-6 border border-blue-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-slate-600">Total Documents</span>
          </div>
          <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{documents.length}</div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-6 border border-emerald-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <CheckCircle className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-slate-600">Analyzed</span>
          </div>
          <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{processedDocs.length}</div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white p-6 border border-amber-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-slate-600">Processing</span>
          </div>
          <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{documents.filter(d => d.status === 'processing').length}</div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-red-50 to-white p-6 border border-red-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
              <AlertCircle className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-slate-600">Failed</span>
          </div>
          <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{documents.filter(d => d.status === 'failed' || d.status === 'failed_processing').length}</div>
        </div>
      </div>

      {/* Document Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        {/* Analyzed Documents */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" /> Recently Analyzed
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
            {processedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="bg-slate-50 p-4 rounded-full mb-3">
                  <CheckCircle className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">No analyzed documents found.</p>
                <p className="text-slate-400 text-sm mt-1">Upload a document to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {processedDocs.slice(0, 5).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-5 hover:bg-slate-50/80 transition-colors group">
                    <div className="flex flex-col truncate pr-4">
                      <span className="text-[15px] font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{doc.filename}</span>
                      <span className="text-sm text-slate-500 mt-0.5">{format(new Date(doc.created_at), "MMM d, yyyy")}</span>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 text-blue-600 hover:bg-blue-50 border-blue-100 h-9 rounded-full px-4" onClick={() => router.push(`/dashboard/documents/${doc.id}`)}>
                      View <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending / Failed Documents */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Action Required
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
            {pendingFailedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="bg-emerald-50 p-4 rounded-full mb-3">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-slate-700 font-medium">All clear!</p>
                <p className="text-slate-500 text-sm mt-1">No documents require your attention right now.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingFailedDocs.slice(0, 5).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-5 hover:bg-slate-50/80 transition-colors group">
                    <div className="flex flex-col truncate pr-4">
                      <span className="text-[15px] font-semibold text-slate-900 truncate">{doc.filename}</span>
                      <span className="text-sm text-slate-500 mt-0.5">{format(new Date(doc.created_at), "MMM d, yyyy")}</span>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold shrink-0 border ${doc.status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {doc.status === 'processing' ? 'Processing...' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
